import cloudinary from "../utils/cloudinary.js";
import { ProductModel } from "../models/product.model.js";
import prisma from "../utils/prisma.js";

const parseBooleanParam = (value) =>
  value === "true" ? true : value === "false" ? false : undefined;

const parseNumberParam = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const productInclude = {
  collections: {
    include: {
      collection: true,
    },
  },
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
};

const parseCollectionIds = (value) => {
  const list = asArray(value)
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => Number(String(entry).trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);

  return Array.from(new Set(list));
};

const serializeProduct = (product) => {
  const collectionNames =
    product.collections?.map((item) => item.collection.name) || [];
  const collectionIds =
    product.collections?.map((item) => item.collection.id) || [];

  const fallbackNames =
    collectionNames.length === 0 && product.collection
      ? [product.collection]
      : collectionNames;

  return {
    ...product,
    collectionNames: fallbackNames,
    collectionIds,
    collections: undefined,
  };
};

const resolveCollectionSelection = async ({ collectionIdsRaw, fallbackName }) => {
  const collectionIds = parseCollectionIds(collectionIdsRaw);

  if (collectionIds.length > 0) {
    const linkedCollections = await prisma.collection.findMany({
      where: { id: { in: collectionIds } },
      select: { id: true, name: true },
    });

    if (linkedCollections.length !== collectionIds.length) {
      throw new Error("INVALID_COLLECTION_SELECTION");
    }

    const ordered = collectionIds
      .map((id) => linkedCollections.find((item) => item.id === id))
      .filter(Boolean);

    return {
      primaryCollection: ordered[0].name,
      linkIds: ordered.map((item) => item.id),
    };
  }

  const normalizedFallback = String(fallbackName || "").trim();
  if (!normalizedFallback) {
    return { primaryCollection: "", linkIds: [] };
  }

  const matched = await prisma.collection.findFirst({
    where: { name: { equals: normalizedFallback, mode: "insensitive" } },
    select: { id: true, name: true },
  });

  if (!matched) {
    return { primaryCollection: normalizedFallback, linkIds: [] };
  }

  return {
    primaryCollection: matched.name,
    linkIds: [matched.id],
  };
};

/* ================= CREATE PRODUCT (OWNER) ================= */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      collection,
      collectionIds,
      price,
      discountPrice,
      stock,
      weightGrams,
      isBestSelling,
    } = req.body;

    const createdById = req.user.userId;
    const imageUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "products" }
        );
        imageUrls.push(result.secure_url);
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ message: "At least one image required" });
    }
    if (!weightGrams || Number(weightGrams) <= 0) {
      return res.status(400).json({ message: "weightGrams must be a positive number" });
    }

    const selection = await resolveCollectionSelection({
      collectionIdsRaw: collectionIds,
      fallbackName: collection,
    });

    if (!selection.primaryCollection) {
      return res.status(400).json({ message: "Select at least one collection" });
    }

    const product = await prisma.product.create({
      data: {
        title,
        description,
        collection: selection.primaryCollection,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock),
        weightGrams: Number(weightGrams),
        images: imageUrls,
        isBestSelling: isBestSelling === "true",
        createdById,
        ...(selection.linkIds.length > 0
          ? {
              collections: {
                createMany: {
                  data: selection.linkIds.map((id) => ({ collectionId: id })),
                },
              },
            }
          : {}),
      },
      include: productInclude,
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    if (error.message === "INVALID_COLLECTION_SELECTION") {
      return res.status(400).json({ message: "Invalid collection selection" });
    }
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

/* ================= UPDATE PRODUCT (OWNER) ================= */
export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: productInclude,
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      description,
      collection,
      collectionIds,
      price,
      discountPrice,
      stock,
      weightGrams,
      imageIndexes,
      isBestSelling,
    } = req.body;

    const images = [...existing.images];

    if (req.files && req.files.length > 0) {
      if (!imageIndexes) {
        return res.status(400).json({ message: "imageIndexes required" });
      }

      const indexes = JSON.parse(imageIndexes);

      if (!Array.isArray(indexes) || indexes.length !== req.files.length) {
        return res.status(400).json({
          message: "Images and indexes count mismatch",
        });
      }

      for (let i = 0; i < indexes.length; i += 1) {
        const index = Number(indexes[i]);
        const file = req.files[i];

        if (!Number.isInteger(index) || index < 0 || index > 3) {
          return res.status(400).json({ message: "Invalid image index" });
        }

        const oldImage = images[index];
        if (oldImage) {
          const publicId = getPublicIdFromUrl(oldImage);
          await cloudinary.uploader.destroy(publicId);
        }

        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "products" }
        );

        images[index] = result.secure_url;
      }
    }

    if (weightGrams !== undefined && Number(weightGrams) <= 0) {
      return res.status(400).json({ message: "weightGrams must be a positive number" });
    }

    const selection = await resolveCollectionSelection({
      collectionIdsRaw: collectionIds,
      fallbackName: collection || existing.collection,
    });

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(selection.primaryCollection ? { collection: selection.primaryCollection } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(discountPrice !== undefined
          ? { discountPrice: discountPrice ? Number(discountPrice) : null }
          : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(weightGrams !== undefined ? { weightGrams: Number(weightGrams) } : {}),
        images,
        ...(isBestSelling !== undefined ? { isBestSelling: isBestSelling === "true" } : {}),
        ...(collectionIds !== undefined || collection !== undefined
          ? {
              collections: {
                deleteMany: {},
                ...(selection.linkIds.length > 0
                  ? {
                      createMany: {
                        data: selection.linkIds.map((id) => ({ collectionId: id })),
                      },
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: productInclude,
    });

    res.json(serializeProduct(updated));
  } catch (err) {
    if (err.message === "INVALID_COLLECTION_SELECTION") {
      return res.status(400).json({ message: "Invalid collection selection" });
    }
    console.error("UPDATE PRODUCT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE PRODUCT (OWNER) ================= */
export const deleteProduct = async (req, res) => {
  try {
    await ProductModel.delete(Number(req.params.id));
    res.json({ message: "Product deleted" });
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
};

/* ================= GET ALL PRODUCTS (PUBLIC) ================= */
export const getAllProducts = async (req, res) => {
  try {
    let { search } = req.query;
    if (Array.isArray(search)) search = search[0];

    const products = await prisma.product.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { collection: { contains: search, mode: "insensitive" } },
              {
                collections: {
                  some: {
                    collection: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });

    res.json(products.map(serializeProduct));
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= ADVANCED PRODUCT CATALOG ================= */
export const getProductCatalog = async (req, res) => {
  try {
    let { search, collection, minPrice, maxPrice, inStock, bestSelling, sort, page, limit } =
      req.query;

    if (Array.isArray(search)) search = search[0];
    if (Array.isArray(collection)) collection = collection[0];
    if (Array.isArray(minPrice)) minPrice = minPrice[0];
    if (Array.isArray(maxPrice)) maxPrice = maxPrice[0];
    if (Array.isArray(inStock)) inStock = inStock[0];
    if (Array.isArray(bestSelling)) bestSelling = bestSelling[0];
    if (Array.isArray(sort)) sort = sort[0];
    if (Array.isArray(page)) page = page[0];
    if (Array.isArray(limit)) limit = limit[0];

    const parsedPage = Math.max(parseNumberParam(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseNumberParam(limit) || 12, 1), 48);
    const parsedMinPrice = parseNumberParam(minPrice);
    const parsedMaxPrice = parseNumberParam(maxPrice);
    const parsedInStock = parseBooleanParam(inStock);
    const parsedBestSelling = parseBooleanParam(bestSelling);

    const where = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { collection: { contains: search, mode: "insensitive" } },
              {
                collections: {
                  some: {
                    collection: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(collection
        ? {
            OR: [
              { collection: { equals: collection, mode: "insensitive" } },
              {
                collections: {
                  some: {
                    collection: { name: { equals: collection, mode: "insensitive" } },
                  },
                },
              },
            ],
          }
        : {}),
      ...(parsedInStock ? { stock: { gt: 0 } } : {}),
      ...(parsedBestSelling !== undefined ? { isBestSelling: parsedBestSelling } : {}),
      ...((parsedMinPrice !== undefined || parsedMaxPrice !== undefined)
        ? {
            price: {
              ...(parsedMinPrice !== undefined ? { gte: parsedMinPrice } : {}),
              ...(parsedMaxPrice !== undefined ? { lte: parsedMaxPrice } : {}),
            },
          }
        : {}),
    };

    const orderByMap = {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      title_asc: { title: "asc" },
      title_desc: { title: "desc" },
      stock_desc: { stock: "desc" },
    };

    const orderBy = orderByMap[sort] || orderByMap.newest;
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total, collectionsData] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
        include: productInclude,
      }),
      prisma.product.count({ where }),
      prisma.collection.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    const totalPages = Math.max(Math.ceil(total / parsedLimit), 1);

    res.json({
      items: items.map(serializeProduct),
      meta: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
        hasNext: parsedPage < totalPages,
        hasPrev: parsedPage > 1,
      },
      filters: {
        collections: collectionsData.map((item) => item.name),
      },
    });
  } catch (err) {
    console.error("GET PRODUCT CATALOG ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
      include: productInclude,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(serializeProduct(product));
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= BEST SELLING PRODUCTS ================= */
export const getBestSellingProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isBestSelling: true,
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: productInclude,
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("BEST SELLING PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch best selling products" });
  }
};

/* ================= RELATED PRODUCTS ================= */
export const getRelatedProducts = async (req, res) => {
  try {
    const { collection } = req.params;
    const { excludeId } = req.query;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { collection: { equals: collection, mode: "insensitive" } },
          {
            collections: {
              some: {
                collection: {
                  name: { equals: collection, mode: "insensitive" },
                },
              },
            },
          },
        ],
        ...(excludeId && {
          id: { not: Number(excludeId) },
        }),
      },
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: productInclude,
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("RELATED PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch related products" });
  }
};

/* ================= UTILS ================= */
const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  const name = file.split(".")[0];
  return `products/${name}`;
};


import cloudinary from "../utils/cloudinary.js";
import { ProductModel } from "../models/product.model.js";
import prisma from "../utils/prisma.js";

const parseBooleanParam = (value) =>
  value === "true" ? true : value === "false" ? false : undefined;

const parseNumberParam = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const serializeProduct = (product) => product;

/* ================= CREATE PRODUCT (OWNER) ================= */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
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

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock),
        weightGrams: Number(weightGrams),
        images: imageUrls,
        isBestSelling: isBestSelling === "true",
        createdById,
      },
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
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
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      description,
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
        if (oldImage && oldImage.startsWith("http")) {
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

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(discountPrice !== undefined
          ? { discountPrice: discountPrice ? Number(discountPrice) : null }
          : {}),
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(weightGrams !== undefined ? { weightGrams: Number(weightGrams) } : {}),
        images,
        ...(isBestSelling !== undefined ? { isBestSelling: isBestSelling === "true" } : {}),
      },
    });

    res.json(serializeProduct(updated));
  } catch (err) {
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
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
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
    let { search, minPrice, maxPrice, inStock, bestSelling, sort, page, limit } =
      req.query;

    if (Array.isArray(search)) search = search[0];
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
              { description: { contains: search, mode: "insensitive" } },
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

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parsedLimit,
      }),
      prisma.product.count({ where }),
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
      filters: {},
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
    });

    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error("BEST SELLING PRODUCTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch best selling products" });
  }
};

/* ================= UTILS ================= */
const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  const name = file.split(".")[0];
  return `products/${name}`;
};

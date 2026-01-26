import cloudinary from "../utils/cloudinary.js";
import { ProductModel } from "../models/product.model.js";
import prisma from "../utils/prisma.js";

/* CREATE (OWNER) */
export const createProduct = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      price,
      discountPrice,
      stock,
    } = req.body;

    const createdById = req.user.userId;

    // 🔥 UPLOAD IMAGES TO CLOUDINARY
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

    const product = await prisma.product.create({
      data: {
        title,
        description,
        category,
        subCategory,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock),
        images: imageUrls, // ✅ NO UNDEFINED
        createdById,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

/* UPDATE (OWNER) */
/* UPDATE (OWNER) — REPLACE IMAGES SAFELY */
export const updateProduct = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const existing = await ProductModel.findById(productId);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      description,
      category,
      subCategory,
      price,
      discountPrice,
      stock,
      imageIndexes,
    } = req.body;

    // start with old images
    const images = [...existing.images];

    /* ---------- IMAGE REPLACEMENT ---------- */
    if (req.files && req.files.length > 0) {
      if (!imageIndexes) {
        return res
          .status(400)
          .json({ message: "imageIndexes required" });
      }

      const indexes = JSON.parse(imageIndexes); // [0,2]

      if (indexes.length !== req.files.length) {
        return res.status(400).json({
          message: "Images and indexes count mismatch",
        });
      }

      for (let i = 0; i < indexes.length; i++) {
        const index = indexes[i];
        const file = req.files[i];

        if (index < 0 || index > 3) {
          return res.status(400).json({ message: "Invalid image index" });
        }

        const oldImage = images[index];

        // 🔴 DELETE OLD IMAGE FIRST
        if (oldImage) {
          const publicId = getPublicIdFromUrl(oldImage);
          await cloudinary.uploader.destroy(publicId);
        }

        // 🟢 UPLOAD NEW IMAGE
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
          { folder: "products" }
        );

        images[index] = result.secure_url;
      }
    }

    /* ---------- UPDATE PRODUCT ---------- */
    const updated = await ProductModel.update(productId, {
      title,
      description,
      category,
      subCategory,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock),
      images,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



/* DELETE (OWNER) */
export const deleteProduct = async (req, res) => {
  try {
    await ProductModel.delete(Number(req.params.id));
    res.json({ message: "Product deleted" });
  } catch {
    res.status(404).json({ message: "Product not found" });
  }
};

/* PUBLIC */
/* GET ALL PRODUCTS + SEARCH */
export const getAllProducts = async (req, res) => {
  try {
    let { search } = req.query;

    // ✅ FORCE search to be a string
    if (Array.isArray(search)) {
      search = search[0];
    }

    const products = await ProductModel.findAll(search);

    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err); // 🔥 IMPORTANT
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await ProductModel.findById(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};


const getPublicIdFromUrl = (url) => {
  // example:
  // https://res.cloudinary.com/.../products/abc123.jpg
  const parts = url.split("/");
  const file = parts[parts.length - 1];
  const name = file.split(".")[0];
  return `products/${name}`;
};

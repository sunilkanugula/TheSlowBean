import { ProductModel } from "../models/product.model.js";

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
      images
    } = req.body;

    if (!title || !category || !price || !stock || !images) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(images) || images.length > 4) {
      return res.status(400).json({ message: "Max 4 images allowed" });
    }

    const product = await ProductModel.create({
      title,
      description,
      category,
      subCategory,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      stock: Number(stock),
      images,
      createdById: req.user.id
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* UPDATE (OWNER) */
export const updateProduct = async (req, res) => {
  try {
    const product = await ProductModel.update(
      Number(req.params.id),
      req.body
    );
    res.json(product);
  } catch {
    res.status(404).json({ message: "Product not found" });
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
export const getAllProducts = async (req, res) => {
  const products = await ProductModel.findAll();
  res.json(products);
};

export const getProductById = async (req, res) => {
  const product = await ProductModel.findById(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  res.json(product);
};

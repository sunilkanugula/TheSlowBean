import prisma from "../utils/prisma.js";
import { WishlistModel } from "../models/wishlist.model.js";

/* GET USER WISHLIST */
export const getWishlist = async (req, res) => {
  try {
    const items = await WishlistModel.findByUser(req.user.userId);
    const products = items.map((item) => item.product);
    res.json(products);
  } catch (err) {
    console.error("GET WISHLIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ADD TO WISHLIST */
export const addToWishlist = async (req, res) => {
  try {
    const productId = Number(req.body.productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await WishlistModel.add({
      userId: req.user.userId,
      productId,
    });

    res.json({ message: "Added to wishlist" });
  } catch (err) {
    if (err?.code === "P2003") {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    console.error("ADD WISHLIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* REMOVE FROM WISHLIST */
export const removeFromWishlist = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    await WishlistModel.remove({
      userId: req.user.userId,
      productId,
    });

    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error("REMOVE WISHLIST ERROR:", err);
    res.json({ message: "Already removed" });
  }
};

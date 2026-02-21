import { CartModel } from "../models/cart.model.js";
import prisma from "../utils/prisma.js";

export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { productId, quantity } = req.body;
    const pid = Number(productId);
    const qty = Number(quantity) || 1;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!pid) {
      return res.status(400).json({ message: "Product ID required" });
    }

    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await prisma.product.findUnique({
      where: { id: pid },
      select: { id: true, stock: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    await CartModel.addItem(Number(userId), pid, qty);

    res.json({ message: "Added to cart" });
  } catch (err) {
    if (err?.code === "P2003") {
      return res.status(400).json({ message: "Invalid cart or product reference" });
    }
    console.error("ADD TO CART ERROR:", err);
    res.status(500).json({ message: "Failed to add to cart" });
  }
};

export const getCart = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const cart = await CartModel.getCart(Number(userId));
    res.json(cart || { items: [] });
  } catch (err) {
    console.error("GET CART ERROR:", err);
    res.status(500).json({ message: "Failed to load cart" });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const productId = Number(req.params.productId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    await CartModel.removeItem(Number(userId), productId);
    res.json({ message: "Removed from cart" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.json({ message: "Already removed" });
    }
    console.error("REMOVE CART ERROR:", err);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

export const updateCartItemQty = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pid = Number(req.body.productId);
    const qty = Number(req.body.quantity);

    if (!pid) {
      return res.status(400).json({ message: "Product ID required" });
    }

    if (!qty || qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await prisma.product.findUnique({
      where: { id: pid },
      select: { stock: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (qty > product.stock) {
      return res.status(400).json({ message: "Requested quantity exceeds stock" });
    }

    const cart = await CartModel.getOrCreateCart(userId);

    await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: pid,
        },
      },
      data: { quantity: qty },
    });

    res.json({ message: "Quantity updated" });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Item not found in cart" });
    }
    console.error("UPDATE QTY ERROR:", err);
    res.status(500).json({ message: "Failed to update quantity" });
  }
};

import { CartModel } from "../models/cart.model.js";
import prisma from "../utils/prisma.js";

export const addToCart = async (req, res) => {
  try {
    console.log("USER:", req.user);        // 🔥 DEBUG
    console.log("BODY:", req.body);        // 🔥 DEBUG

    const userId = req.user?.userId;
    const { productId, quantity } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized (no userId)" });
    }

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    await CartModel.addItem(
      Number(userId),
      Number(productId),
      Number(quantity) || 1
    );

    res.json({ message: "Added to cart" });
  } catch (err) {
    console.error("ADD TO CART ERROR:", err); // 🔥 THIS WILL SHOW REAL CAUSE
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
    res.json(cart);
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

    await CartModel.removeItem(Number(userId), productId);
    res.json({ message: "Removed from cart" });
  } catch (err) {
    console.error("REMOVE CART ERROR:", err);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

export const updateCartItemQty = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await CartModel.getOrCreateCart(userId);

    await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      data: { quantity },
    });

    res.json({ message: "Quantity updated" });
  } catch (err) {
    console.error("UPDATE QTY ERROR:", err);
    res.status(500).json({ message: "Failed to update quantity" });
  }
};

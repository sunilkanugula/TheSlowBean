import { WishlistModel } from "../models/wishlist.model.js";

/* GET USER WISHLIST */
export const getWishlist = async (req, res) => {
  try {
    const items = await WishlistModel.findByUser(req.user.userId);

    // Return only products (frontend-friendly)
    const products = items.map((item) => item.product);

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ADD TO WISHLIST */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID required" });
    }

    await WishlistModel.add({
      userId: req.user.userId,
      productId: Number(productId),
    });

    res.json({ message: "Added to wishlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* REMOVE FROM WISHLIST (IDEMPOTENT ✅) */
export const removeFromWishlist = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    await WishlistModel.remove({
      userId: req.user.userId,
      productId,
    });

    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    // ✅ Already removed → still OK
    res.json({ message: "Already removed" });
  }
};

import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import {
  wishlistBodySchema,
  wishlistParamSchema,
} from "../validations/wishlist.validation.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/", protect, validate(wishlistBodySchema), addToWishlist);
router.delete("/:productId", protect, validate(wishlistParamSchema), removeFromWishlist);

export default router;

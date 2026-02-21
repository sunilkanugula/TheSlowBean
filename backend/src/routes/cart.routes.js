import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addToCart,
  getCart,
  removeFromCart,updateCartItemQty
} from "../controllers/cart.controller.js";
import {
  addToCartSchema,
  cartProductParamSchema,
  updateQtySchema,
} from "../validations/cart.validation.js";

const router = express.Router();

router.post("/", protect, validate(addToCartSchema), addToCart);
router.get("/", protect, getCart);
router.delete("/:productId", protect, validate(cartProductParamSchema), removeFromCart);
router.put("/quantity", protect, validate(updateQtySchema), updateCartItemQty);

export default router;

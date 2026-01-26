import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
} from "../controllers/product.controller.js";

const router = express.Router();

/* ---------- PUBLIC ---------- */
router.get("/", getAllProducts);
router.get("/:id", getProductById);

/* ---------- OWNER ONLY ---------- */
router.post(
  "/",
  protect,
  ownerOnly,
  upload.array("images", 4),
  createProduct
);

router.put(
  "/:id",
  protect,
  ownerOnly,
  upload.array("images", 4), // 🔑 ADD THIS
  updateProduct
);

router.delete("/:id", protect, ownerOnly, deleteProduct);

export default router;

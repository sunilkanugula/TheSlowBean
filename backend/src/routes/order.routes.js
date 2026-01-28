import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/razorpay/create", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.get("/my", protect, getMyOrders);

export default router;

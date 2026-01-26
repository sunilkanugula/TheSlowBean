import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import {
  checkout,
  getMyOrders,markPaymentCompleted
} from "../controllers/order.controller.js";

const router = express.Router();

router.post("/checkout", protect, checkout);
router.get("/my", protect, getMyOrders);
router.put("/:id/payment-success", protect, markPaymentCompleted);

export default router;

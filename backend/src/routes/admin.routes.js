import express from "express";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/orders", ownerOnly, getAllOrders);
router.put("/orders/:orderId/status", ownerOnly, updateOrderStatus);
router.get("/dashboard", ownerOnly, getDashboardStats);

export default router;

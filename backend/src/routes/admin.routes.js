import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  addAdminOrderNote,
  getDashboardStats,
  getDashboardOverview,
  decideReturnRequest,
  getAdminOrderTracking,
} from "../controllers/admin.controller.js";
import {
  adminOrderNoteSchema,
  returnDecisionSchema,
  updateOrderStatusSchema,
} from "../validations/admin.validation.js";

const router = express.Router();

router.get("/orders", protect, ownerOnly, getAllOrders);
router.put("/orders/:orderId/status", protect, ownerOnly, validate(updateOrderStatusSchema), updateOrderStatus);
router.get("/orders/:orderId/tracking", protect, ownerOnly, getAdminOrderTracking);
router.post("/orders/:orderId/return-decision", protect, ownerOnly, validate(returnDecisionSchema), decideReturnRequest);
router.post("/orders/:orderId/notes", protect, ownerOnly, validate(adminOrderNoteSchema), addAdminOrderNote);
router.get("/dashboard", protect, ownerOnly, getDashboardStats);
router.get("/overview", protect, ownerOnly, getDashboardOverview);

export default router;

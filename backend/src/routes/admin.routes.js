import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  getAllOrders,
  updateOrderStatus,
  addAdminOrderNote,
  getDashboardStats,
  getDashboardOverview,
  decideReturnRequest,
  getAdminOrderTracking,
  getShiprocketDocument,
} from "../controllers/admin.controller.js";
import {
  createCollection,
  deleteCollection,
  getCollections,
} from "../controllers/collection.controller.js";
import {
  adminOrderNoteSchema,
  returnDecisionSchema,
  updateOrderStatusSchema,
} from "../validations/admin.validation.js";

const router = express.Router();

router.get("/orders", protect, ownerOnly, getAllOrders);
router.put("/orders/:orderId/status", protect, ownerOnly, validate(updateOrderStatusSchema), updateOrderStatus);
router.get("/orders/:orderId/tracking", protect, ownerOnly, getAdminOrderTracking);
router.get("/orders/:orderId/shiprocket-document", protect, ownerOnly, getShiprocketDocument);
router.post("/orders/:orderId/return-decision", protect, ownerOnly, validate(returnDecisionSchema), decideReturnRequest);
router.post("/orders/:orderId/notes", protect, ownerOnly, validate(adminOrderNoteSchema), addAdminOrderNote);
router.get("/dashboard", protect, ownerOnly, getDashboardStats);
router.get("/overview", protect, ownerOnly, getDashboardOverview);
router.get("/collections", protect, ownerOnly, getCollections);
router.post("/collections", protect, ownerOnly, upload.single("image"), createCollection);
router.delete("/collections/:id", protect, ownerOnly, deleteCollection);

export default router;

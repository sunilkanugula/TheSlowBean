import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  requestReturn,
  getMyOrderTracking,
  getPublicOrderTracking,
  shiprocketWebhook,
  razorpayWebhook,
  cancelMyOrder,
  addOrderNote,
} from "../controllers/order.controller.js";
import {
  orderIdParamSchema,
  orderNoteSchema,
  razorpayVerifySchema,
  returnRequestSchema,
  trackQuerySchema,
} from "../validations/order.validation.js";

const router = express.Router();

router.post("/razorpay/create", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, validate(razorpayVerifySchema), verifyRazorpayPayment);
router.post("/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);
router.get("/track", validate(trackQuerySchema), getPublicOrderTracking);
router.post("/tracking/webhook/shiprocket", shiprocketWebhook);
router.get("/my", protect, getMyOrders);
router.get("/:id/tracking", protect, validate(orderIdParamSchema), getMyOrderTracking);
router.post("/:id/return", protect, validate(returnRequestSchema), requestReturn);
router.post("/:id/cancel", protect, validate(orderIdParamSchema), cancelMyOrder);
router.post("/:id/notes", protect, validate(orderNoteSchema), addOrderNote);
router.get("/test-whatsapp", async (req, res) => {
  const { sendWhatsApp } = await import("../utils/sendWhatsApp.js");
  const result = await sendWhatsApp({
    to: "7093770108",
    message: "Meta WhatsApp Cloud API test successful",
  });

  res.json(result);
});

export default router;



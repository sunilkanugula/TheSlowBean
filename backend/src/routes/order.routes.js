import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
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
  createCodOrder,
} from "../controllers/order.controller.js";
import {
  orderIdParamSchema,
  orderNoteSchema,
  razorpayVerifySchema,
  returnRequestSchema,
  trackQuerySchema,
} from "../validations/order.validation.js";

const router = express.Router();

router.post("/cod", protect, createCodOrder);
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
router.post("/test-whatsapp", protect, ownerOnly, async (req, res) => {
  const { sendWhatsApp } = await import("../utils/sendWhatsApp.js");
  const to =
    req.body?.to ||
    req.query?.to ||
    process.env.ADMIN_WHATSAPP_PHONE;
  const message =
    req.body?.message ||
    req.query?.message ||
    "Meta WhatsApp Cloud API test successful";

  if (!to) {
    return res.status(400).json({
      message: "Recipient phone is required (body/query: to), or set ADMIN_WHATSAPP_PHONE",
    });
  }

  const result = await sendWhatsApp({
    to,
    message,
  });

  res.json({
    ...result,
    to,
    message,
  });
});

export default router;



import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { ownerOnly } from "../middlewares/owner.middleware.js";
import { validateCoupon, listCoupons, createCoupon, toggleCoupon, deleteCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);
router.get("/", protect, ownerOnly, listCoupons);
router.post("/", protect, ownerOnly, createCoupon);
router.patch("/:id", protect, ownerOnly, toggleCoupon);
router.delete("/:id", protect, ownerOnly, deleteCoupon);

export default router;

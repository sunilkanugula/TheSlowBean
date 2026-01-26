import express from "express";
import {
  register,
  verifyEmailOTP,
  resendEmailOTP,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* AUTH */
router.post("/register", register);
router.post("/verify-email-otp", verifyEmailOTP);
router.post("/resend-email-otp", resendEmailOTP);
router.post("/login", login);

/* FORGOT PASSWORD */
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

/* LOGGED IN */
router.post("/change-password", protect, changePassword);

export default router;

import express from "express";
import {
  register,
  verifyEmailOTP,
  resendEmailOTP,
  login,
  googleLogin,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  getMe,
  logoutAll,
  updateProfile,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  emailOtpSchema,
  resendEmailSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validations/auth.validation.js";

const router = express.Router();

/* AUTH */
router.post("/register", validate(registerSchema), register);
router.post("/verify-email-otp", validate(emailOtpSchema), verifyEmailOTP);
router.post("/resend-email-otp", validate(resendEmailSchema), resendEmailOTP);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleLoginSchema), googleLogin);

/* FORGOT PASSWORD */
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/verify-reset-otp", validate(emailOtpSchema), verifyResetOTP);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

/* LOGGED IN */
router.post("/change-password", protect, validate(changePasswordSchema), changePassword);
router.get("/me", protect, getMe);
router.post("/logout-all", protect, logoutAll);
router.put("/profile", protect, updateProfile);

export default router;

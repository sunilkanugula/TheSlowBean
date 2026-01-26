import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendEmail } from "../utils/sendEmail.js";

/* REGISTER */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await UserModel.findByEmail(email);
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      otpCode: otp,
      otpExpires,
      isVerified: false
    });

    await sendEmail(email, "Verify Account", `Your OTP is ${otp}`);

    res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
  console.error("EMAIL ERROR:", err);
  res.status(500).json({
    message: "Server error",
    error: err.message
  });
}
};

/* VERIFY OTP */
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user || user.otpCode !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (new Date() > user.otpExpires)
    return res.status(400).json({ message: "OTP expired" });

  await UserModel.verifyUser(email);
  res.json({ message: "Account verified" });
};

/* RESEND OTP */
export const resendOTP = async (req, res) => {
  const { email } = req.body;
  const user = await UserModel.findByEmail(email);

  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await UserModel.updateOTP(email, otp, otpExpires);
  await sendEmail(email, "Resend OTP", `Your OTP is ${otp}`);

  res.json({ message: "OTP resent" });
};

/* LOGIN */
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  if (!user.isVerified)
    return res.status(403).json({ message: "Email not verified" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await UserModel.updateOTP(email, otp, otpExpires);
  await sendEmail(email, "Reset Password OTP", `OTP: ${otp}`);

  res.json({ message: "OTP sent" });
};

/* RESET PASSWORD */
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user || user.otpCode !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (new Date() > user.otpExpires)
    return res.status(400).json({ message: "OTP expired" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(user.id, hashed);

  res.json({ message: "Password reset successful" });
};

/* CHANGE PASSWORD */
export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await UserModel.findById(req.user.id);
  const match = await bcrypt.compare(oldPassword, user.password);

  if (!match)
    return res.status(401).json({ message: "Wrong password" });

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePassword(user.id, hashed);

  res.json({ message: "Password changed" });
};

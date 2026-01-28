import bcrypt from "bcrypt";
import { UserModel } from "../models/user.model.js";
import { generateToken } from "../utils/generateToken.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendEmail } from "../utils/sendEmail.js";

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log("Registering user:", name, email);
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await UserModel.findByEmail(email);
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      emailOtpHash: otpHash,
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      emailVerified: false
    });

    await sendEmail(email, "Verify Account", `Your OTP is ${otp}`);

    res.status(201).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY EMAIL OTP ================= */
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user || !user.emailOtpHash)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > user.emailOtpExpires)
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp, user.emailOtpHash);
    if (!valid)
      return res.status(400).json({ message: "Invalid OTP" });

    await UserModel.verifyEmail(email);

    res.json({ message: "Account verified" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESEND EMAIL OTP ================= */
export const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await UserModel.updateEmailOTP(
      email,
      otpHash,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    await sendEmail(email, "Verify Account", `Your OTP is ${otp}`);

    res.json({ message: "OTP resent" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.emailVerified)
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
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await UserModel.setResetOTP(
      email,
      otpHash,
      new Date(Date.now() + 10 * 60 * 1000)
    );

    await sendEmail(email, "Reset Password OTP", `OTP: ${otp}`);

    res.json({ message: "OTP sent" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY RESET OTP ================= */
export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user || !user.resetOtpHash)
      return res.status(400).json({ message: "Invalid OTP" });

    if (new Date() > user.resetOtpExpires)
      return res.status(400).json({ message: "OTP expired" });

    const valid = await bcrypt.compare(otp, user.resetOtpHash);
    if (!valid)
      return res.status(400).json({ message: "Invalid OTP" });

    await UserModel.markResetVerified(email);

    res.json({ message: "OTP verified" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await UserModel.findByEmail(email);
    console.log(user)
    if (!user || !user.resetVerified)
      return res.status(403).json({ message: "OTP not verified" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashed);
    await UserModel.clearResetOTP(email);

    res.json({ message: "Password reset successful" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user.userId);
    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match)
      return res.status(401).json({ message: "Wrong password" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(user.id, hashed);

    res.json({ message: "Password changed" });
  } catch (err) {
  console.error("CHANGE PASSWORD ERROR:", err);
  res.status(500).json({ message: "Server error" });
}

};

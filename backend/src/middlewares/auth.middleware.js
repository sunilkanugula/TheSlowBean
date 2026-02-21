import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(decoded.userId ?? decoded.id);

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, tokenVersion: true },
      });
    } catch {
      // Fallback for stale Prisma client that does not yet include tokenVersion.
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });
    }

    if (!user) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    if (
      Object.prototype.hasOwnProperty.call(user, "tokenVersion") &&
      (decoded.tokenVersion ?? 0) !== user.tokenVersion
    ) {
      return res.status(401).json({ message: "Session invalidated. Please login again." });
    }

    // Support both old tokens ({ id }) and current tokens ({ userId }).
    req.user = {
      ...decoded,
      userId: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion ?? decoded.tokenVersion ?? 0,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

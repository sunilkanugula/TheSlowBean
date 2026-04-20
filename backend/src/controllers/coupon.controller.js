import prisma from "../utils/prisma.js";

// POST /api/coupons/validate — body: { code, orderTotal }
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ message: "Invalid or expired coupon" });
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value for this coupon is Rs ${coupon.minOrderValue}`,
      });
    }

    const discount =
      coupon.discountType === "PERCENT"
        ? Number(((orderTotal * coupon.discountValue) / 100).toFixed(2))
        : Math.min(coupon.discountValue, orderTotal);

    res.json({
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalTotal: Number((orderTotal - discount).toFixed(2)),
    });
  } catch (err) {
    console.error("VALIDATE COUPON ERROR:", err);
    res.status(500).json({ message: "Failed to validate coupon" });
  }
};

// GET /api/coupons — admin only: list all coupons
export const listCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coupons" });
  }
};

// POST /api/coupons — admin only: create coupon
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ message: "code, discountType and discountValue required" });
    }
    if (!["PERCENT", "FLAT"].includes(discountType)) {
      return res.status(400).json({ message: "discountType must be PERCENT or FLAT" });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    console.error("CREATE COUPON ERROR:", err);
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

// PATCH /api/coupons/:id — admin only: toggle active
export const toggleCoupon = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

// DELETE /api/coupons/:id — admin only
export const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

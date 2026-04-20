import prisma from "../utils/prisma.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// POST /api/addresses
export const createAddress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { label, name, phone, altPhone, line1, city, state, pincode, isDefault } = req.body;

    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return res.status(400).json({ message: "name, phone, line1, city, state, pincode are required" });
    }

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const count = await prisma.address.count({ where: { userId } });
    const address = await prisma.address.create({
      data: {
        userId,
        label: label || "Home",
        name,
        phone,
        altPhone: altPhone || null,
        line1,
        city,
        state,
        pincode,
        isDefault: isDefault || count === 0,
      },
    });
    res.status(201).json(address);
  } catch (err) {
    console.error("CREATE ADDRESS ERROR:", err);
    res.status(500).json({ message: "Failed to create address" });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;
    const { label, name, phone, altPhone, line1, city, state, pincode, isDefault } = req.body;

    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(altPhone !== undefined ? { altPhone } : {}),
        ...(line1 !== undefined ? { line1 } : {}),
        ...(city !== undefined ? { city } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(pincode !== undefined ? { pincode } : {}),
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update address" });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: "Address not found" });
    await prisma.address.delete({ where: { id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete address" });
  }
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.userId;
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) return res.status(404).json({ message: "Address not found" });

    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    const updated = await prisma.address.update({ where: { id }, data: { isDefault: true } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to set default address" });
  }
};

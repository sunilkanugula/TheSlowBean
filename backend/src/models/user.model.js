import prisma from "../utils/prisma.js";

export const UserModel = {
  /* ================= BASIC ================= */

  create: (data) => {
    return prisma.user.create({ data });
  },

  findByEmail: (email) => {
    return prisma.user.findUnique({ where: { email } });
  },

  findById: (id) => {
    return prisma.user.findUnique({ where: { id } });
  },

  findAll: () => {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  },

  updateRole: (id, role) => {
    return prisma.user.update({
      where: { id },
      data: { role }
    });
  },

  delete: (id) => {
    return prisma.user.delete({ where: { id } });
  },

  /* ================= EMAIL VERIFICATION ================= */

  verifyEmail: (email) => {
    return prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        emailOtpHash: null,
        emailOtpExpires: null
      }
    });
  },

  updateEmailOTP: (email, hash, expires) => {
    return prisma.user.update({
      where: { email },
      data: {
        emailOtpHash: hash,
        emailOtpExpires: expires
      }
    });
  },

  /* ================= FORGOT PASSWORD ================= */

  setResetOTP: (email, hash, expires) => {
    return prisma.user.update({
      where: { email },
      data: {
        resetOtpHash: hash,
        resetOtpExpires: expires,
        resetVerified: false
      }
    });
  },

  markResetVerified: (email) => {
    return prisma.user.update({
      where: { email },
      data: {
        resetVerified: true
      }
    });
  },

  clearResetOTP: (email) => {
    return prisma.user.update({
      where: { email },
      data: {
        resetOtpHash: null,
        resetOtpExpires: null,
        resetVerified: false
      }
    });
  },

  /* ================= PASSWORD ================= */

  updatePassword: (id, password) => {
    return prisma.user.update({
      where: { id },
      data: { password }
    });
  }
};

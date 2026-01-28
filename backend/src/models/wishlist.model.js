import prisma from "../utils/prisma.js";

export const WishlistModel = {
  add: ({ userId, productId }) => {
    return prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {},
      create: {
        userId,
        productId,
      },
    });
  },

  // ✅ SAFE DELETE (NO THROW)
  remove: ({ userId, productId }) => {
    return prisma.wishlist.deleteMany({
      where: {
        userId,
        productId,
      },
    });
  },

  findByUser: (userId) => {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
};

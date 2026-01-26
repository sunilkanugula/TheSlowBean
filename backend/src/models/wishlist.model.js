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

  remove: ({ userId, productId }) => {
    return prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
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

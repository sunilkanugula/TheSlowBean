import prisma from "../utils/prisma.js";

export const CartModel = {
  getOrCreateCart: async (userId) => {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  },

  addItem: async (userId, productId, quantity = 1) => {
    const cart = await CartModel.getOrCreateCart(userId);

    return prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  },

  getCart: async (userId) => {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  },

  removeItem: async (userId, productId) => {
    const cart = await CartModel.getOrCreateCart(userId);

    return prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });
  },
};

import prisma from "../utils/prisma.js";

export const ProductModel = {
  create: (data) => {
    return prisma.product.create({ data });
  },

  findAll: () => {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" }
    });
  },

  findById: (id) => {
    return prisma.product.findUnique({
      where: { id }
    });
  },

  update: (id, data) => {
    return prisma.product.update({
      where: { id },
      data
    });
  },

  delete: (id) => {
    return prisma.product.delete({
      where: { id }
    });
  }
};

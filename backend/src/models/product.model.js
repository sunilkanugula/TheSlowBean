import prisma from "../utils/prisma.js";

export const ProductModel = {
  create: (data) => {
    return prisma.product.create({ data });
  },

  // 🔥 UPDATED: supports search
  findAll: (search) => {
    return prisma.product.findMany({
      where: search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                category: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                subCategory: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  findById: (id) => {
    return prisma.product.findUnique({
      where: { id },
    });
  },

  update: (id, data) => {
    return prisma.product.update({
      where: { id },
      data,
    });
  },

  delete: (id) => {
    return prisma.product.delete({
      where: { id },
    });
  },
};

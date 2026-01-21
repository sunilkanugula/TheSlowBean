import prisma from "../utils/prisma.js";

export const UserModel = {
  create: (data) => {
    return prisma.user.create({ data });
  },

  findByEmail: (email) => {
    return prisma.user.findUnique({
      where: { email }
    });
  },

  findById: (id) => {
    return prisma.user.findUnique({
      where: { id }
    });
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
    return prisma.user.delete({
      where: { id }
    });
  }
};

import prisma from "../utils/prisma.js";

export const AdminModel = {
  /* ================= ALL ORDERS ================= */
  async getAllOrders(skip = 0, limit = 20) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.order.count(),
    ]);

    return { orders, total };
  },

  /* ================= UPDATE ORDER STATUS ================= */
  async updateOrderStatus(orderId, status) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  },

  /* ================= DASHBOARD STATS ================= */
  async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();

    /* ---------- TODAY ORDERS ---------- */
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    /* ---------- TODAY PENDING ---------- */
    const todayPendingOrders = await prisma.order.count({
      where: {
        status: "PENDING",
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    /* ---------- ALL-TIME COUNTS ---------- */
    const [
      totalOrders,
      totalPendingOrders,
      shippedOrders,
      deliveredOrders,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: { status: "PENDING" },
      }),

      prisma.order.count({
        where: { status: "SHIPPED" },
      }),

      prisma.order.count({
        where: { status: "DELIVERED" },
      }),
    ]);

    /* ---------- TODAY REVENUE ---------- */
    const todayRevenue = todayOrders
      .filter((o) => o.paymentCompleted)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    /* ---------- MONTHLY REVENUE ---------- */
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    const monthlyRevenueAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        paymentCompleted: true,
        createdAt: { gte: monthStart },
      },
    });

    return {
      /* TODAY */
      todayOrders: todayOrders.length,
      todayPendingOrders,
      todayRevenue,

      /* ALL TIME */
      totalOrders,
      totalPendingOrders,
      shippedOrders,
      deliveredOrders,

      /* REVENUE */
      monthlyRevenue: monthlyRevenueAgg._sum.totalAmount || 0,
    };
  },
};

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
          shipment: true,
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
      where: { id: Number(orderId) },
      data: {
        deliveryStatus: status,
      },
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
        deliveryStatus: "CREATED",
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
        where: { deliveryStatus: "CREATED" },
      }),

      prisma.order.count({
        where: { deliveryStatus: "IN_TRANSIT" },
      }),

      prisma.order.count({
        where: { deliveryStatus: "DELIVERED" },
      }),
    ]);

    /* ---------- TODAY REVENUE ---------- */
    const todayRevenue = todayOrders
      .filter((o) => o.paymentStatus === "PAID")
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
        paymentStatus: "PAID",
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

  /* ================= ADVANCED DASHBOARD OVERVIEW ================= */
  async getDashboardOverview() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      returnRequestedOrders,
      lowStockProducts,
      recentOrders,
      paidOrdersAll,
      paidOrdersThisMonth,
      paidOrdersLast7Days,
      groupedTopProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: "PAID" } }),
      prisma.order.count({ where: { deliveryStatus: "CREATED" } }),
      prisma.order.count({ where: { deliveryStatus: "RETURN_REQUESTED" } }),
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          stock: true,
          images: true,
          category: true,
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            select: { id: true, quantity: true, price: true },
          },
        },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "PAID", createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const totalRevenue = paidOrdersAll.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const monthlyRevenue = paidOrdersThisMonth.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const averageOrderValue =
      paidOrders > 0 ? Number((totalRevenue / paidOrders).toFixed(2)) : 0;

    const trendMap = new Map();
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      trendMap.set(key, 0);
    }

    paidOrdersLast7Days.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) || 0) + order.totalAmount);
    });

    const salesTrend = Array.from(trendMap.entries()).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2)),
    }));

    const topProductIds = groupedTopProducts.map((item) => item.productId);
    const topProductMap = new Map(
      (
        await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: {
            id: true,
            title: true,
            images: true,
            stock: true,
            category: true,
          },
        })
      ).map((product) => [product.id, product])
    );

    const topProducts = groupedTopProducts
      .map((item) => {
        const product = topProductMap.get(item.productId);
        if (!product) return null;
        return {
          ...product,
          unitsSold: item._sum.quantity || 0,
        };
      })
      .filter(Boolean);

    return {
      kpis: {
        totalOrders,
        paidOrders,
        pendingOrders,
        returnRequestedOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        monthlyRevenue: Number(monthlyRevenue.toFixed(2)),
        averageOrderValue,
      },
      salesTrend,
      lowStockProducts,
      topProducts,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        deliveryStatus: order.deliveryStatus,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        user: order.user,
        itemsCount: order.items.length,
      })),
    };
  },
};

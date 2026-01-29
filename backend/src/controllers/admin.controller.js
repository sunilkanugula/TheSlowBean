import { AdminModel } from "../models/admin.model.js";
import prisma from "../utils/prisma.js";
/**
 * GET ALL ORDERS (ADMIN)
 */
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { orders, total } = await AdminModel.getAllOrders(
      skip,
      limit
    );

    res.json({
      orders,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET ALL ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};


/**
 * UPDATE ORDER STATUS (ADMIN)
 */

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body;

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status required" });
    }

    const validTransitions = {
      PENDING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
      RETURN_REQUESTED: ["RETURN_APPROVED", "RETURN_REJECTED"],
      RETURN_APPROVED: ["RETURNED"],
    };

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const allowed =
        validTransitions[order.orderStatus] || [];

      if (!allowed.includes(status)) {
        throw new Error(
          `INVALID_TRANSITION:${order.orderStatus}->${status}`
        );
      }

      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
      });

      if (status === "RETURNED") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }
    });

    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error("ADMIN UPDATE STATUS ERROR:", err);

    if (err.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }

    if (err.message.startsWith("INVALID_TRANSITION")) {
      return res.status(400).json({
        message: err.message.replace("INVALID_TRANSITION:", ""),
      });
    }

    res.status(500).json({ message: "Failed to update order status" });
  }
};


/**
 * DASHBOARD STATS (ADMIN)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await AdminModel.getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error("DASHBOARD ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};

import { AdminModel } from "../models/admin.model.js";

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

    if (!status) {
      return res.status(400).json({ message: "Status required" });
    }

    const order = await AdminModel.updateOrderStatus(orderId, status);
    res.json(order);
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
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

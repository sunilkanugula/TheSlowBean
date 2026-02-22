import { AdminModel } from "../models/admin.model.js";
import prisma from "../utils/prisma.js";
import {
  notifyCustomerReturnDecision,
  notifyOrderStatusChange,
} from "../services/notification.service.js";
import {
  createShipmentForOrder,
  syncTrackingForOrder,
  triggerReturnForOrder,
} from "../services/delivery.service.js";
import { fetchShiprocketDocument } from "../services/shiprocket.service.js";
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

    if (status !== "CONFIRMED") {
      return res.status(400).json({
        message: "Only CONFIRMED status is allowed from admin action",
      });
    }

    const result = await createShipmentForOrder(orderId);

    await notifyOrderStatusChange(orderId, "CONFIRMED");

    res.json({
      success: true,
      awbCode: result.awbCode || null,
      courierName: result.courierName || null,
      trackingUrl: result.trackingUrl || null,
    });
  } catch (err) {
    console.error("ADMIN UPDATE STATUS ERROR:", err);

    if (err.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    if (err.message === "ORDER_NOT_PAID") {
      return res.status(400).json({ message: "Order payment is not completed" });
    }
    if (err.message === "SHIPMENT_ALREADY_EXISTS") {
      await prisma.order.updateMany({
        where: {
          id: Number(req.params.orderId),
          deliveryStatus: "CREATED",
        },
        data: { deliveryStatus: "CONFIRMED" },
      });

      const existing = await prisma.deliveryShipment.findUnique({
        where: { orderId: Number(req.params.orderId) },
      });

      return res.status(200).json({
        success: true,
        alreadyConfirmed: true,
        message: "Shipment already exists for this order",
        awbCode: existing?.awbCode || null,
        courierName: null,
        trackingUrl: existing?.trackingUrl || null,
      });
    }
    if (err.message === "ORDER_NOT_CONFIRMED") {
      return res.status(400).json({ message: "Order must be in CONFIRMED state before shipment creation" });
    }
    if (err.message === "INVALID_PRODUCT_WEIGHT") {
      return res.status(400).json({ message: "All products must have valid weightGrams for shipment" });
    }
    if (String(err.message || "").startsWith("SHIPROCKET_CREATE_ORDER_FAILED:")) {
      return res.status(502).json({
        message: "Shiprocket create order failed",
        detail: err.message.replace("SHIPROCKET_CREATE_ORDER_FAILED:", ""),
      });
    }
    if (String(err.message || "").startsWith("SHIPROCKET_ASSIGN_AWB_FAILED:")) {
      return res.status(502).json({
        message: "Shiprocket AWB assignment failed",
        detail: err.message.replace("SHIPROCKET_ASSIGN_AWB_FAILED:", ""),
      });
    }
    if (String(err.message || "").startsWith("SHIPROCKET_PICKUP_SCHEDULE_FAILED:")) {
      return res.status(502).json({
        message: "Shiprocket pickup scheduling failed",
        detail: err.message.replace("SHIPROCKET_PICKUP_SCHEDULE_FAILED:", ""),
      });
    }
    if (err.message === "SHIPROCKET_SHIPMENT_ID_MISSING") {
      return res.status(502).json({
        message: "Shiprocket did not return shipment id required for auto AWB/pickup scheduling",
      });
    }
    if (err.message === "SHIPROCKET_CREDENTIALS_MISSING") {
      return res.status(400).json({
        message:
          "Shiprocket is not configured. Set SHIPROCKET_TOKEN or SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD, or enable TEST_MODE.",
      });
    }
    if (err.message === "SHIPROCKET_TOKEN_EXPIRED") {
      return res.status(400).json({
        message: "Shiprocket token is expired. Update SHIPROCKET_TOKEN or switch to TEST_MODE.",
      });
    }
    res.status(500).json({ message: "Failed to update order status" });
  }
};

export const decideReturnRequest = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const decision = String(req.body?.decision || "").toUpperCase();
    const reason = String(req.body?.reason || "").trim();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryStatus !== "RETURN_REQUESTED") {
      return res.status(400).json({ message: "No pending return request for this order" });
    }

    if (decision === "REJECT") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { deliveryStatus: "DELIVERED" },
        });
        await tx.orderTrackingEvent.create({
          data: {
            orderId,
            status: "DELIVERED",
            title: "Return request rejected by admin",
            description: reason || "Return request rejected.",
            source: "ADMIN",
            eventTime: new Date(),
          },
        });
      });

      await notifyCustomerReturnDecision(orderId, "REJECT", reason);
      return res.json({ message: "Return request rejected" });
    }

    await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        status: "RETURN_REQUESTED",
        title: "Return request approved by admin",
        description: reason || "Return request approved.",
        source: "ADMIN",
        eventTime: new Date(),
      },
    });

    await triggerReturnForOrder(orderId, reason);
    await notifyCustomerReturnDecision(orderId, "ACCEPT", reason);

    return res.json({ message: "Return request approved and sent to Shiprocket" });
  } catch (err) {
    console.error("RETURN DECISION ERROR:", err);
    return res.status(500).json({ message: "Failed to process return decision" });
  }
};

export const getAdminOrderTracking = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const latest = await syncTrackingForOrder(orderId);

    return res.json({
      orderId: latest.id,
      deliveryStatus: latest.deliveryStatus,
      shipment: latest.shipment,
      events: latest.trackingEvents,
      lastUpdatedAt: latest.shipment?.lastSyncedAt || latest.createdAt,
    });
  } catch (err) {
    console.error("ADMIN ORDER TRACKING ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch tracking" });
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

export const addAdminOrderNote = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { type = "NOTE", title, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ message: "Order not found" });

    await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        status: order.deliveryStatus,
        title: `${type}: ${title}`,
        description: note,
        source: "ADMIN",
      },
    });

    res.json({ message: "Admin note added" });
  } catch (err) {
    console.error("ADD ADMIN NOTE ERROR:", err);
    res.status(500).json({ message: "Failed to add note" });
  }
};

export const getShiprocketDocument = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const type = String(req.query.type || "invoice").toLowerCase();

    if (!orderId || Number.isNaN(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.shipment) {
      return res.status(400).json({ message: "Shipment not found for this order" });
    }

    const result = await fetchShiprocketDocument(order.shipment, type);

    if (!result?.url) {
      return res.status(404).json({
        message: `Shiprocket ${type} URL is not available yet`,
        detail: result?.rawPayload || null,
      });
    }

    return res.json({
      success: true,
      type,
      url: result.url,
    });
  } catch (err) {
    console.error("SHIPROCKET DOCUMENT ERROR:", err);

    if (err.message === "SHIPROCKET_DOCUMENT_TYPE_INVALID") {
      return res.status(400).json({ message: "Invalid document type. Use invoice or label." });
    }
    if (err.message === "SHIPROCKET_ORDER_ID_MISSING") {
      return res.status(400).json({ message: "Shiprocket order id missing for this shipment" });
    }
    if (err.message === "SHIPROCKET_SHIPMENT_ID_MISSING") {
      return res.status(400).json({ message: "Shiprocket shipment id missing for this shipment" });
    }
    if (String(err.message || "").startsWith("SHIPROCKET_INVOICE_FETCH_FAILED:")) {
      return res.status(502).json({
        message: "Failed to fetch Shiprocket invoice",
        detail: err.message.replace("SHIPROCKET_INVOICE_FETCH_FAILED:", ""),
      });
    }
    if (String(err.message || "").startsWith("SHIPROCKET_LABEL_FETCH_FAILED:")) {
      return res.status(502).json({
        message: "Failed to fetch Shiprocket label",
        detail: err.message.replace("SHIPROCKET_LABEL_FETCH_FAILED:", ""),
      });
    }

    return res.status(500).json({ message: "Failed to fetch Shiprocket document" });
  }
};

/**
 * ADVANCED OVERVIEW (ADMIN)
 */
export const getDashboardOverview = async (req, res) => {
  try {
    const overview = await AdminModel.getDashboardOverview();
    res.json(overview);
  } catch (err) {
    console.error("DASHBOARD OVERVIEW ERROR:", err);
    res.status(500).json({ message: "Failed to load dashboard overview" });
  }
};

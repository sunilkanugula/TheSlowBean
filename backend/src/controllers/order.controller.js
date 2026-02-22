import crypto from "crypto";
import prisma from "../utils/prisma.js";
import razorpay from "../utils/razorpay.js";
import {
  applyTrackingUpdate,
  syncTrackingForOrder,
} from "../services/delivery.service.js";
import {
  notifyOrderPlaced,
  notifyAdminReturnRequested,
  notifyOrderStatusChange,
} from "../services/notification.service.js";

const toNumber = (value) => Number(value);
const idempotencyCache = new Map();
const GST_RATE = 0.05;

const getCartTotals = (items = []) => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const gstAmount = Number((subtotal * GST_RATE).toFixed(2));
  const totalAmount = Number((subtotal + gstAmount).toFixed(2));

  return { subtotal, gstAmount, totalAmount };
};

const parseWebhookOrderId = (payload) => {
  const directId = Number(payload?.orderId || payload?.order_id || payload?.reference_order_id);
  if (directId) return directId;

  const ref = String(payload?.order_id || payload?.reference_order_id || "");
  const matched = ref.match(/(\d+)$/);
  return matched ? Number(matched[1]) : NaN;
};

const getIdempotencyCacheKey = (userId, key) => `${userId}:${key}`;

/* ================= CREATE RAZORPAY ORDER ================= */
export const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment gateway is not configured" });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const { subtotal, gstAmount, totalAmount } = getCartTotals(cart.items);
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid cart total" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_${Date.now()}`,
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      subtotal,
      gstAmount,
      totalAmount,
      gstRate: GST_RATE,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("RAZORPAY CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/* ================= VERIFY PAYMENT & CREATE ORDER ================= */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, idempotencyKey } = req.body;
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment gateway is not configured" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment verification payload" });
    }

    if (!address || !address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
      return res.status(400).json({ message: "Incomplete delivery address" });
    }

    if (idempotencyKey) {
      const cacheKey = getIdempotencyCacheKey(userId, idempotencyKey);
      const existing = idempotencyCache.get(cacheKey);
      if (existing) {
        return res.json(existing);
      }
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const existingOrder = await prisma.order.findFirst({
      where: { razorpayPaymentId: razorpay_payment_id },
    });

    if (existingOrder) {
      return res.json({
        message: "Order already processed",
        orderId: existingOrder.id,
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.product.title}`,
        });
      }
    }

    const { subtotal, gstAmount, totalAmount } = getCartTotals(cart.items);

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          paymentStatus: "PAID",
          deliveryStatus: "CREATED",
          paidAt: new Date(),
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          address,
        },
      });

      for (const item of cart.items) {
        const price = item.product.discountPrice ?? item.product.price;

        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price,
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
          },
        });
      }

      await tx.orderTrackingEvent.create({
        data: {
          orderId: createdOrder.id,
          status: "CREATED",
          title: "Order created",
          description: "Payment completed and order placed.",
          source: "SHIPROCKET",
          eventTime: new Date(),
        },
      });

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });

    // These side-effects should not fail payment verification response.
    Promise.allSettled([notifyOrderPlaced(order.id)]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("POST ORDER SIDE-EFFECT ERROR:", result.reason);
        }
      }
    });

    const responsePayload = {
      message: "Payment successful, order placed",
      orderId: order.id,
      subtotal,
      gstAmount,
      totalAmount,
      gstRate: GST_RATE,
    };

    if (idempotencyKey) {
      const cacheKey = getIdempotencyCacheKey(userId, idempotencyKey);
      idempotencyCache.set(cacheKey, responsePayload);
      setTimeout(() => idempotencyCache.delete(cacheKey), 10 * 60 * 1000);
    }

    res.json(responsePayload);
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    res.status(500).json({ message: "Payment failed" });
  }
};

const attemptRefund = async (order) => {
  if (!order?.razorpayPaymentId) return { ok: false, reason: "payment_id_missing" };
  if (!razorpay) return { ok: false, reason: "gateway_not_configured" };
  try {
    await razorpay.payments.refund(order.razorpayPaymentId, {});
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err?.error?.description || "refund_failed" };
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = toNumber(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["CREATED", "CONFIRMED"].includes(order.deliveryStatus)) {
      return res.status(400).json({ message: "Order can no longer be cancelled" });
    }

    const refund = await attemptRefund(order);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: "FAILED",
          paymentStatus: refund.ok ? "REFUNDED" : order.paymentStatus,
        },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      await tx.orderTrackingEvent.create({
        data: {
          orderId,
          status: "FAILED",
          title: "Order cancelled by customer",
          description: refund.ok
            ? "Order cancelled and payment refunded."
            : `Order cancelled but refund pending: ${refund.reason}`,
          source: "CUSTOMER",
        },
      });
    });

    res.json({
      message: refund.ok
        ? "Order cancelled and refund initiated"
        : "Order cancelled, refund will be processed manually",
    });

    Promise.allSettled([
      notifyOrderStatusChange(orderId, refund.ok ? "CANCELLED" : "CANCELLED_REFUND_PENDING"),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("CANCEL ORDER SIDE-EFFECT ERROR:", result.reason);
        }
      }
    });
  } catch (err) {
    console.error("CANCEL ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

export const addOrderNote = async (req, res) => {
  try {
    const orderId = toNumber(req.params.id);
    const { title, note, type = "NOTE" } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    const isAdmin = req.user.role === "ADMIN";
    if (!isAdmin && order.userId !== req.user.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        status: order.deliveryStatus,
        title: `${type}: ${title}`,
        description: note,
        source: isAdmin ? "ADMIN" : "CUSTOMER",
      },
    });

    res.json({ message: "Note added" });
  } catch (err) {
    console.error("ADD ORDER NOTE ERROR:", err);
    res.status(500).json({ message: "Failed to add note" });
  }
};

/* ================= GET MY ORDERS ================= */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/* ================= REQUEST RETURN (USER) ================= */
export const requestReturn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = toNumber(req.params.id);
    const reason = String(req.body?.reason || "").trim();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.deliveryStatus !== "DELIVERED") {
      return res.status(400).json({ message: "Return allowed only after delivery" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { deliveryStatus: "RETURN_REQUESTED" },
      });

      await tx.orderTrackingEvent.create({
        data: {
          orderId,
          status: "RETURN_REQUESTED",
          title: "Return requested",
          description: reason || "Customer requested return.",
          source: "CUSTOMER",
          eventTime: new Date(),
        },
      });
    });

    await notifyAdminReturnRequested(orderId, reason);
    res.json({ message: "Return request submitted" });
  } catch (err) {
    console.error("RETURN REQUEST ERROR:", err);
    res.status(500).json({ message: "Failed to request return" });
  }
};

/* ================= ORDER TRACKING (AUTH USER) ================= */
export const getMyOrderTracking = async (req, res) => {
  try {
    const orderId = toNumber(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== req.user.userId) {
      return res.status(404).json({ message: "Order not found" });
    }

    const latest = await syncTrackingForOrder(orderId);

    res.json({
      orderId: latest.id,
      deliveryStatus: latest.deliveryStatus,
      shipment: latest.shipment,
      events: latest.trackingEvents,
    });
  } catch (err) {
    console.error("GET ORDER TRACKING ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tracking" });
  }
};

/* ================= ORDER TRACKING (PUBLIC) ================= */
export const getPublicOrderTracking = async (req, res) => {
  try {
    const orderId = toNumber(req.query.orderId);
    const mobile = String(req.query.mobile || "").trim();

    if (!orderId && !mobile) {
      return res.status(400).json({ message: "orderId or mobile is required" });
    }

    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (mobile) {
        const address = order.address || {};
        const phones = [String(address.phone || ""), String(address.altPhone || "")];
        if (!phones.includes(mobile)) {
          return res.status(404).json({ message: "Order not found for this mobile number" });
        }
      }
    } else {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { address: { path: ["phone"], equals: mobile } },
            { address: { path: ["altPhone"], equals: mobile } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      if (!order) return res.status(404).json({ message: "No order found for this mobile number" });
    }

    const latest = await syncTrackingForOrder(order.id);

    res.json({
      orderId: latest.id,
      deliveryStatus: latest.deliveryStatus,
      shipment: latest.shipment,
      events: latest.trackingEvents,
      lastUpdatedAt: latest.shipment?.lastSyncedAt || latest.createdAt,
    });
  } catch (err) {
    console.error("PUBLIC ORDER TRACKING ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tracking" });
  }
};

/* ================= SHIPROCKET WEBHOOK ================= */
export const shiprocketWebhook = async (req, res) => {
  try {
    const expectedSecret = process.env.SHIPROCKET_WEBHOOK_SECRET;
    const providedSecret = req.headers["x-webhook-secret"] || req.headers["x-shiprocket-secret"];

    if (expectedSecret && expectedSecret !== providedSecret) {
      return res.status(401).json({ message: "Invalid webhook secret" });
    }

    const payload = req.body || {};
    const orderId = parseWebhookOrderId(payload);

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required in webhook payload" });
    }

    const statusText = payload.status || payload.current_status || payload.shipment_status;

    await applyTrackingUpdate({
      orderId,
      status: statusText,
      title: payload.title || `Shiprocket update: ${statusText || "IN_TRANSIT"}`,
      description: payload.description || payload.remarks || null,
      location: payload.location || payload.current_location || null,
      source: "SHIPROCKET",
      shiprocketOrderId: payload.order_id || payload.reference_order_id || null,
      awbCode: payload.awb || payload.awb_code || null,
      trackingUrl: payload.tracking_url || payload.trackingUrl || null,
      rawPayload: payload,
      eventTime: payload.event_time || payload.updated_at || null,
    });

    await notifyOrderStatusChange(orderId, statusText || "TRACKING_UPDATED");

    res.json({ ok: true });
  } catch (err) {
    console.error("SHIPROCKET WEBHOOK ERROR:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const payload = req.body;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).json({ message: "Invalid Razorpay webhook signature" });
    }

    const event = JSON.parse(payload.toString("utf8"));
    const entity = event?.payload?.payment?.entity;
    const paymentId = entity?.id;
    const orderId = entity?.order_id;

    if (!paymentId) return res.json({ ok: true });

    if (event.event === "payment.captured") {
      await prisma.order.updateMany({
        where: { razorpayPaymentId: paymentId },
        data: { paymentStatus: "PAID" },
      });
    }

    if (event.event === "payment.failed") {
      await prisma.order.updateMany({
        where: {
          OR: [{ razorpayPaymentId: paymentId }, { razorpayOrderId: orderId }],
        },
        data: { paymentStatus: "FAILED" },
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("RAZORPAY WEBHOOK ERROR:", err);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

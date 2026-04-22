import prisma from "../utils/prisma.js";
import { sendTelegram } from "../utils/sendTelegram.js";

const prettyStatus = (status) => String(status || "").replaceAll("_", " ");

const getOrderForNotification = async (orderId) => {
  return prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      shipment: true,
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { title: true } } } },
    },
  });
};

const orderUrl = (orderId) =>
  `${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${orderId}/tracking`;

/* ── Admin Telegram notifications only ── */

export const notifyOrderPlaced = async (orderId) => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const address = order.address || {};
  const itemLines = (order.items || [])
    .map((i) => `  • ${i.product?.title || "Product"} × ${i.quantity}`)
    .join("\n");

  const message = [
    "🛒 *New Order Received*",
    "",
    `📦 *Order ID:* #${order.id}`,
    `💰 *Total:* Rs ${Number(order.totalAmount).toFixed(2)}`,
    "",
    `👤 *Customer:* ${order.user?.name || address.name || "N/A"}`,
    `📧 *Email:* ${order.user?.email || "N/A"}`,
    `📱 *Phone:* ${address.phone || "N/A"}`,
    `📍 *Address:* ${address.line1 || ""}, ${address.city || ""}, ${address.state || ""} – ${address.pincode || ""}`,
    "",
    "*Items:*",
    itemLines,
    "",
    `🔗 [View in Dashboard](${process.env.FRONTEND_URL || "http://localhost:5173"}/owner/orders)`,
  ].join("\n");

  await sendTelegram(message);
};

export const notifyOrderStatusChange = async (orderId, status) => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const address = order.address || {};
  const trackUrl = order.shipment?.trackingUrl || orderUrl(order.id);

  const message = [
    "🔄 *Order Status Updated*",
    "",
    `📦 *Order ID:* #${order.id}`,
    `👤 *Customer:* ${order.user?.name || address.name || "N/A"}`,
    `📊 *New Status:* ${prettyStatus(status)}`,
    "",
    `🔗 [Track Order](${trackUrl})`,
    `🔗 [Dashboard](${process.env.FRONTEND_URL || "http://localhost:5173"}/owner/orders)`,
  ].join("\n");

  await sendTelegram(message);
};

export const notifyAdminReturnRequested = async (orderId, reason = "") => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const address = order.address || {};

  const message = [
    "↩️ *Return Request Raised*",
    "",
    `📦 *Order ID:* #${order.id}`,
    `👤 *Customer:* ${order.user?.name || address.name || "N/A"}`,
    `📱 *Phone:* ${address.phone || "N/A"}`,
    reason ? `📝 *Reason:* ${reason}` : "📝 *Reason:* Not provided",
    "",
    `🔗 [Review Request](${process.env.FRONTEND_URL || "http://localhost:5173"}/owner/orders)`,
  ].join("\n");

  await sendTelegram(message);
};

export const notifyCustomerReturnDecision = async () => {
  // Customer notifications removed — admin-only Telegram setup
};

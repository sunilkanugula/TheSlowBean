import prisma from "../utils/prisma.js";
import { sendWhatsApp } from "../utils/sendWhatsApp.js";

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_PHONE || "7093770108";

const orderUrl = (orderId) =>
  `${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${orderId}/tracking`;

const extractPhone = (order) => {
  const address = order?.address || {};
  return address.phone || address.altPhone || null;
};

const prettyStatus = (status) => String(status || "").replaceAll("_", " ");

const getOrderForNotification = async (orderId) => {
  return prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { shipment: true },
  });
};

const safeSend = async (phones, message) => {
  const list = Array.isArray(phones) ? phones : [phones];
  const results = [];

  for (const phone of list) {
    if (!phone) {
      results.push({ sent: false, reason: "missing_phone" });
      continue;
    }

    try {
      const res = await sendWhatsApp({ to: phone, message });
      results.push({ sent: Boolean(res?.sent), phone, reason: res?.reason || null });
    } catch (err) {
      console.error("WHATSAPP SEND ERROR:", err);
      results.push({ sent: false, phone, reason: "send_failed" });
    }
  }

  return results;
};

export const notifyOrderPlaced = async (orderId) => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const customerPhone = extractPhone(order);

  const message = [
    "New Order Placed",
    `Order #${order.id}`,
    `Amount: Rs ${order.totalAmount}`,
    order.shipment?.trackingUrl
      ? `Track: ${order.shipment.trackingUrl}`
      : `Track: ${orderUrl(order.id)}`,
  ].join("\n");

  await safeSend([customerPhone, ADMIN_PHONE], message);
};

export const notifyOrderStatusChange = async (orderId, status) => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const customerPhone = extractPhone(order);

  const message = [
    "Order Status Update",
    `Order #${order.id}`,
    `Status: ${prettyStatus(status)}`,
    order.shipment?.trackingUrl
      ? `Track live: ${order.shipment.trackingUrl}`
      : `Track: ${orderUrl(order.id)}`,
  ].join("\n");

  await safeSend([customerPhone, ADMIN_PHONE], message);
};

export const notifyAdminReturnRequested = async (orderId, reason = "") => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const customerPhone = extractPhone(order);
  const message = [
    "Return Request Raised",
    `Order #${order.id}`,
    `Customer: ${customerPhone || "N/A"}`,
    reason ? `Reason: ${reason}` : "Reason: Not provided",
    `Review: ${process.env.FRONTEND_URL || "http://localhost:5173"}/owner/orders`,
  ].join("\n");

  await safeSend([ADMIN_PHONE], message);
};

export const notifyCustomerReturnDecision = async (orderId, decision, reason = "") => {
  const order = await getOrderForNotification(orderId);
  if (!order) return;

  const customerPhone = extractPhone(order);
  const isApproved = String(decision || "").toUpperCase() === "ACCEPT";

  const message = [
    isApproved ? "Return Approved" : "Return Rejected",
    `Order #${order.id}`,
    isApproved
      ? "Our team will arrange return pickup soon."
      : "Your return request was not approved.",
    reason ? `Note: ${reason}` : null,
    `Track: ${order.shipment?.trackingUrl || orderUrl(order.id)}`,
  ]
    .filter(Boolean)
    .join("\n");

  await safeSend([customerPhone], message);
};

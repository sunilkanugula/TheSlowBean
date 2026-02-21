import prisma from "../utils/prisma.js";
import { sendWhatsApp } from "../utils/sendWhatsApp.js";
const ADMIN_PHONE = "7093770108";
const orderUrl = (orderId) =>
  `${process.env.FRONTEND_URL || "http://localhost:5173"}/orders/${orderId}`;

const extractPhone = (order) => {
  const address = order?.address || {};
  return address.phone || address.altPhone || null;
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
      results.push({ sent: true, phone, res });
    } catch (err) {
      console.error("WHATSAPP SEND ERROR:", err);
      results.push({ sent: false, phone, reason: "send_failed" });
    }
  }

  return results;
};

export const notifyOrderPlaced = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { shipment: true },
  });
  if (!order) return;

  const customerPhone = extractPhone(order);

  const message = [
    `🟢 New Order Placed`,
    `Order #${order.id}`,
    `Amount: Rs ${order.totalAmount}`,
    order.shipment?.trackingUrl
      ? `Track: ${order.shipment.trackingUrl}`
      : `Track: ${orderUrl(order.id)}`,
  ].join("\n");

  await safeSend(
    [customerPhone, ADMIN_PHONE],
    message
  );
};

export const notifyOrderStatusChange = async (orderId, status) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { shipment: true },
  });
  if (!order) return;

  const customerPhone = extractPhone(order);

  const message = [
    `📦 Order Status Update`,
    `Order #${order.id}`,
    `Status: ${status}`,
    order.shipment?.trackingUrl
      ? `Track live: ${order.shipment.trackingUrl}`
      : `Track: ${orderUrl(order.id)}`,
  ].join("\n");

  await safeSend(
    [customerPhone, ADMIN_PHONE],
    message
  );
};
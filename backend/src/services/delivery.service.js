import prisma from "../utils/prisma.js";
import {
  createShiprocketShipment,
  createShiprocketReturn,
  fetchShiprocketTrackingByAwb,
  mapShiprocketStatusToDeliveryStatus,
} from "./shiprocket.service.js";

const normalizeDeliveryStatus = (value) => {
  const raw = String(value || "").toUpperCase().trim();
  const allowed = new Set([
    "CREATED",
    "CONFIRMED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "RETURN_REQUESTED",
    "RETURNED",
  ]);

  if (allowed.has(raw)) return raw;
  return mapShiprocketStatusToDeliveryStatus(raw);
};

const buildPackageDimensionsByWeight = (totalWeightKg) => {
  if (totalWeightKg <= 1) return { length: 20, breadth: 15, height: 10 };
  if (totalWeightKg <= 3) return { length: 30, breadth: 25, height: 15 };
  return { length: 40, breadth: 30, height: 25 };
};

const buildShiprocketOrderPayload = (order) => {
  const address = order.address || {};
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
  const configuredGstRate = Number(process.env.GST_RATE || 0.05);
  const configuredGstPercent = Number((configuredGstRate * 100).toFixed(2));
  const shiprocketPricesIncludeGst =
    String(process.env.SHIPROCKET_PRICES_INCLUDE_GST || "true").toLowerCase() === "true";
  const subTotal = Number(
    order.items
      .reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      .toFixed(2)
  );
  const totalFromOrder = Number(order.totalAmount || 0);
  const inferredTax =
    totalFromOrder > subTotal
      ? Number((totalFromOrder - subTotal).toFixed(2))
      : Number((subTotal * configuredGstRate).toFixed(2));
  const grandTotal = Number((subTotal + inferredTax).toFixed(2));
  const invoiceDate = new Date(order.createdAt).toISOString().slice(0, 10);

  const totalWeightGrams = order.items.reduce((sum, item) => {
    return sum + Number(item.product.weightGrams || 0) * Number(item.quantity || 0);
  }, 0);

  if (totalWeightGrams <= 0) {
    throw new Error("INVALID_PRODUCT_WEIGHT");
  }

  const totalWeightKg = Number((totalWeightGrams / 1000).toFixed(3));
  const dimensions = buildPackageDimensionsByWeight(totalWeightKg);

  const orderItems = order.items.map((item) => {
    const basePrice = Number(item.price || 0);
    const gstInclusivePrice = Number((basePrice * (1 + configuredGstRate)).toFixed(2));
    const sellingPrice = shiprocketPricesIncludeGst ? gstInclusivePrice : basePrice;
    const lineSubtotal = basePrice * Number(item.quantity || 0);
    const lineTax =
      subTotal > 0 ? Number(((lineSubtotal / subTotal) * inferredTax).toFixed(2)) : 0;

      return {
        name: item.product.title,
        sku: `SKU-${item.product.id}`,
        units: item.quantity,
        selling_price: sellingPrice,
        tax: configuredGstPercent,
      };
    });

  const shiprocketSubTotal = shiprocketPricesIncludeGst ? grandTotal : subTotal;
  const shiprocketTax = shiprocketPricesIncludeGst ? 0 : inferredTax;

  return {
    order_id: String(order.id),
    order_date: invoiceDate,
    invoice_no: `TSB-${order.id}`,
    invoice_date: invoiceDate,
    pickup_location: pickupLocation,
    channel_id: "",
    billing_customer_name: address.name || order.user?.name || "Customer",
    billing_last_name: "",
    billing_address: address.line1 || "N/A",
    billing_city: address.city || "N/A",
    billing_pincode: address.pincode || "000000",
    billing_state: address.state || "N/A",
    billing_country: "India",
    billing_email: order.user?.email || "support@example.com",
    billing_phone: address.phone || "0000000000",
    shipping_customer_name: address.name || order.user?.name || "Customer",
    shipping_address: address.line1 || "N/A",
    shipping_city: address.city || "N/A",
    shipping_state: address.state || "N/A",
    shipping_country: "India",
    shipping_pincode: address.pincode || "000000",
    shipping_email: order.user?.email || "support@example.com",
    shipping_phone: address.phone || "0000000000",
    shipping_is_billing: false,
    order_items: orderItems,
    payment_method: "Prepaid",
    sub_total: shiprocketSubTotal,
    tax: shiprocketTax,
    total: grandTotal,
    total_discount: 0,
    shipping_charges: 0,
    transaction_charges: 0,
    giftwrap_charges: 0,
    weight: totalWeightKg,
    length: dimensions.length,
    breadth: dimensions.breadth,
    height: dimensions.height,
  };
};

export const createShipmentForOrder = async (orderId) => {
  const numericOrderId = Number(orderId);

  return prisma.$transaction(async (tx) => {
    let order = await tx.order.findUnique({
      where: { id: numericOrderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
        shipment: true,
      },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");
    if (order.paymentStatus !== "PAID") throw new Error("ORDER_NOT_PAID");
    if (order.shipment) throw new Error("SHIPMENT_ALREADY_EXISTS");

    if (order.deliveryStatus === "CREATED") {
      await tx.order.update({
        where: { id: numericOrderId },
        data: { deliveryStatus: "CONFIRMED" },
      });
    }

    order = await tx.order.findUnique({
      where: { id: numericOrderId },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: true } },
        shipment: true,
      },
    });

    if (order.deliveryStatus !== "CONFIRMED") {
      throw new Error("ORDER_NOT_CONFIRMED");
    }

    const shiprocketPayload = buildShiprocketOrderPayload(order);
    const shiprocketResponse = await createShiprocketShipment({
      orderId: numericOrderId,
      payload: shiprocketPayload,
    });

    const shipment = await tx.deliveryShipment.create({
      data: {
        orderId: numericOrderId,
        shiprocketOrderId: shiprocketResponse.shiprocketOrderId,
        awbCode: shiprocketResponse.awbCode,
        trackingUrl: shiprocketResponse.trackingUrl,
        status: "CREATED",
        rawPayload: {
          request: shiprocketPayload,
          response: shiprocketResponse.rawPayload,
        },
        lastSyncedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: numericOrderId },
      data: {
        deliveryStatus: "CONFIRMED",
      },
    });

    await tx.orderTrackingEvent.create({
      data: {
        orderId: numericOrderId,
        status: "CONFIRMED",
        title: "Order Confirmed",
        description: "Order confirmed by admin and shipment created via Shiprocket.",
        source: "SHIPROCKET",
        eventTime: new Date(),
      },
    });

    return {
      shipment,
      awbCode: shiprocketResponse.awbCode,
      trackingUrl: shiprocketResponse.trackingUrl,
      courierName: shiprocketResponse.courierName || null,
    };
  });
};

export const applyTrackingUpdate = async ({
  orderId,
  status,
  title,
  description,
  location,
  source,
  shiprocketOrderId,
  awbCode,
  trackingUrl,
  rawPayload,
  eventTime,
}) => {
  const normalizedStatus = normalizeDeliveryStatus(status || title);
  const numericOrderId = Number(orderId);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: numericOrderId },
      include: { items: true },
    });

    if (!order) throw new Error("ORDER_NOT_FOUND");

    const updatedShipment = await tx.deliveryShipment.upsert({
      where: { orderId: numericOrderId },
      update: {
        status: normalizedStatus,
        shiprocketOrderId: shiprocketOrderId || undefined,
        awbCode: awbCode || undefined,
        trackingUrl: trackingUrl || undefined,
        rawPayload: rawPayload || undefined,
        lastSyncedAt: new Date(),
      },
      create: {
        orderId: numericOrderId,
        shiprocketOrderId: shiprocketOrderId || null,
        awbCode: awbCode || null,
        trackingUrl: trackingUrl || null,
        status: normalizedStatus,
        rawPayload: rawPayload || null,
        lastSyncedAt: new Date(),
      },
    });

    await tx.order.update({
      where: { id: numericOrderId },
      data: { deliveryStatus: normalizedStatus },
    });

    // If Shiprocket marks it returned for the first time, restock inventory.
    if (normalizedStatus === "RETURNED" && order.deliveryStatus !== "RETURNED") {
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

    await tx.orderTrackingEvent.create({
      data: {
        orderId: numericOrderId,
        status: normalizedStatus,
        title: title || `Shipment status: ${normalizedStatus}`,
        description: description || null,
        location: location || null,
        source: source || "SHIPROCKET",
        eventTime: eventTime ? new Date(eventTime) : new Date(),
      },
    });

    return updatedShipment;
  });
};

export const syncTrackingForOrder = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      shipment: true,
      trackingEvents: {
        orderBy: { eventTime: "desc" },
        take: 100,
      },
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!order.shipment) return order;

  const latestOrder = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      shipment: true,
      trackingEvents: {
        orderBy: { eventTime: "desc" },
        take: 100,
      },
    },
  });

  let trackingPayload = null;
  try {
    trackingPayload = await fetchShiprocketTrackingByAwb({
      ...latestOrder.shipment,
      order: { createdAt: latestOrder.createdAt },
      orderId: latestOrder.id,
    });
  } catch (err) {
    if (err.message !== "AWB_REQUIRED") throw err;
  }

  if (!trackingPayload) {
    return prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        shipment: true,
        trackingEvents: {
          orderBy: { eventTime: "desc" },
          take: 50,
        },
      },
    });
  }

  await applyTrackingUpdate({
    orderId: latestOrder.id,
    status: trackingPayload.status,
    title: `Latest status: ${trackingPayload.status.replaceAll("_", " ")}`,
    description: "Auto synced from Shiprocket tracking API.",
    location: trackingPayload.events[0]?.location || null,
    source: "SHIPROCKET",
    awbCode: trackingPayload.awbCode,
    trackingUrl: trackingPayload.trackingUrl,
    rawPayload: trackingPayload.rawPayload,
  });

  const knownEvents = new Set(
    latestOrder.trackingEvents.map(
      (event) =>
        `${event.status}|${event.title}|${event.eventTime.toISOString()}|${event.location || ""}`
    )
  );

  for (const event of trackingPayload.events) {
    const key = `${event.status}|${event.title}|${event.eventTime.toISOString()}|${event.location || ""}`;
    if (knownEvents.has(key)) continue;

    await prisma.orderTrackingEvent.create({
      data: {
        orderId: latestOrder.id,
        status: normalizeDeliveryStatus(event.status),
        title: event.title || "Shipment update",
        description: event.description || null,
        location: event.location || null,
        source: "SHIPROCKET",
        eventTime: event.eventTime,
      },
    });
  }

  return prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      shipment: true,
      trackingEvents: {
        orderBy: { eventTime: "desc" },
        take: 50,
      },
    },
  });
};

export const triggerReturnForOrder = async (orderId, reason) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: {
      user: { select: { name: true, email: true } },
      shipment: true,
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (!order.shipment) throw new Error("SHIPMENT_NOT_FOUND");

  const payload = await createShiprocketReturn(order, order.shipment, reason);

  await prisma.deliveryShipment.update({
    where: { orderId: order.id },
    data: {
      rawPayload: payload.rawPayload || undefined,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.orderTrackingEvent.create({
    data: {
      orderId: order.id,
      status: "RETURN_REQUESTED",
      title: "Return pickup initiated in Shiprocket",
      description: reason || "Return approved by admin and sent to Shiprocket.",
      source: "SHIPROCKET",
      eventTime: new Date(),
    },
  });

  return { ok: true };
};

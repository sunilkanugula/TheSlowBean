import axios from "axios";

const SHIPROCKET_BASE_URL =
  process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external";

const TEST_MODE = String(process.env.TEST_MODE || "true").toLowerCase() === "true";

let tokenCache = {
  token: null,
  expiresAt: 0,
};

const DELIVERY_STATUS_ORDER = [
  "CREATED",
  "CONFIRMED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const mapShiprocketStatusToDeliveryStatus = (statusText = "") => {
  const value = String(statusText).toUpperCase();

  if (value.includes("RETURN")) return "RETURNED";
  if (value.includes("RTO")) return "RETURNED";
  if (value.includes("DELIVERED")) return "DELIVERED";
  if (value.includes("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
  if (value.includes("IN TRANSIT")) return "IN_TRANSIT";
  if (value.includes("PICK")) return "PICKED_UP";
  if (value.includes("CONFIRM")) return "CONFIRMED";
  if (value.includes("FAILED") || value.includes("UNDELIVER")) return "FAILED";
  return "IN_TRANSIT";
};

const buildTestTimeline = (orderCreatedAt) => {
  const createdAt = new Date(orderCreatedAt || new Date());
  const elapsedMs = Date.now() - createdAt.getTime();
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)));

  const stagesToInclude = Math.min(1 + elapsedDays, DELIVERY_STATUS_ORDER.length);
  const events = DELIVERY_STATUS_ORDER.slice(0, stagesToInclude).map((status, index) => ({
    status,
    title: status.replaceAll("_", " "),
    description: `Mock Shiprocket update for ${status.replaceAll("_", " ").toLowerCase()}.`,
    location: index <= 1 ? "Bengaluru" : "In transit hub",
    eventTime: new Date(createdAt.getTime() + index * 6 * 60 * 60 * 1000),
  }));

  return {
    currentStatus: events[events.length - 1]?.status || "CREATED",
    events,
    rawPayload: {
      mode: "TEST_MODE",
      generatedAt: new Date().toISOString(),
    },
  };
};

const getShiprocketToken = async () => {
  if (TEST_MODE) return "TEST_MODE_TOKEN";

  if (tokenCache.token && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("SHIPROCKET_CREDENTIALS_MISSING");
  }

  const authRes = await axios.post(
    `${SHIPROCKET_BASE_URL}/auth/login`,
    { email, password },
    { timeout: 15000 }
  );

  const token = authRes.data?.token;
  if (!token) {
    throw new Error("SHIPROCKET_AUTH_FAILED");
  }

  tokenCache = {
    token,
    expiresAt: Date.now() + 8 * 24 * 60 * 60 * 1000,
  };

  return token;
};

const createShipmentInTestMode = ({ orderId, payload }) => {
  const testAwb = `TSBFWD${orderId}${String(Date.now()).slice(-4)}`;
  const testTrackingUrl =
    payload?.trackingUrl ||
    `${process.env.FRONTEND_URL || "http://localhost:5173"}/track-order?orderId=${orderId}`;

  return {
    shiprocketOrderId: String(payload?.order_id || `TSB-${orderId}`),
    awbCode: testAwb,
    trackingUrl: testTrackingUrl,
    courierName: "Shiprocket Test Courier",
    status: "CREATED",
    rawPayload: {
      mode: "TEST_MODE",
      generatedAt: new Date().toISOString(),
      shipment: "created",
      requestPayload: payload,
    },
  };
};

const createShipmentInLiveMode = async ({ payload }) => {
  const token = await getShiprocketToken();

  let shipmentRes;
  try {
    shipmentRes = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      }
    );
  } catch (err) {
    const apiError = err?.response?.data || err.message;
    throw new Error(`SHIPROCKET_CREATE_ORDER_FAILED:${JSON.stringify(apiError)}`);
  }

  const data = shipmentRes.data || {};
  const orderIdFromApi = data.order_id || data.orderId || payload?.order_id || null;
  const awbCode =
    data.awb_code ||
    data?.awb ||
    data?.shipment?.awb_code ||
    data?.shipment_data?.awb_code ||
    null;
  const trackingUrl =
    data.tracking_url ||
    data?.shipment?.tracking_url ||
    data?.shipment_data?.tracking_url ||
    null;
  const courierName =
    data.courier_name ||
    data?.shipment?.courier_name ||
    data?.shipment_data?.courier_name ||
    data?.courier ||
    null;

  return {
    shiprocketOrderId: orderIdFromApi ? String(orderIdFromApi) : null,
    awbCode,
    trackingUrl,
    courierName,
    status: "CREATED",
    rawPayload: data,
  };
};

export const createShiprocketShipment = async ({ orderId, payload }) => {
  if (TEST_MODE) return createShipmentInTestMode({ orderId, payload });
  return createShipmentInLiveMode({ payload });
};

const createReturnInTestMode = (order) => ({
  status: "RETURN_REQUESTED",
  rawPayload: {
    mode: "TEST_MODE",
    generatedAt: new Date().toISOString(),
    return: "requested",
    orderId: order.id,
    awb_code: `TSBRTN${order.id}${String(Date.now()).slice(-4)}`,
  },
});

const createReturnInLiveMode = async (order, shipment, reason) => {
  const token = await getShiprocketToken();

  const payload = {
    order_id: shipment?.shiprocketOrderId || `TSB-${order.id}`,
    channel_id: "",
    pickup_customer_name: order.address?.name || order.user?.name || "Customer",
    pickup_phone: order.address?.phone || "0000000000",
    pickup_address: order.address?.line1 || "N/A",
    pickup_city: order.address?.city || "N/A",
    pickup_state: order.address?.state || "N/A",
    pickup_pincode: order.address?.pincode || "000000",
    pickup_country: "India",
    reason: reason || "Customer requested return",
    awb_code: shipment?.awbCode || undefined,
  };

  const endpoints = [
    `${SHIPROCKET_BASE_URL}/orders/create/return`,
    `${SHIPROCKET_BASE_URL}/orders/create/return/adhoc`,
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const res = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      });
      return {
        status: "RETURN_REQUESTED",
        rawPayload: res.data || null,
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("SHIPROCKET_RETURN_REQUEST_FAILED");
};

export const createShiprocketReturn = async (order, shipment, reason) => {
  const payload = TEST_MODE
    ? createReturnInTestMode(order)
    : await createReturnInLiveMode(order, shipment, reason);

  const returnAwb =
    payload?.rawPayload?.awb_code ||
    payload?.rawPayload?.shipment?.awb_code ||
    payload?.rawPayload?.data?.awb_code ||
    null;

  if (returnAwb && shipment?.awbCode && String(returnAwb) === String(shipment.awbCode)) {
    throw new Error("RETURN_AWB_MATCHES_FORWARD_AWB");
  }

  return payload;
};

const fetchTrackingInTestMode = (shipment) => {
  const timeline = buildTestTimeline(shipment?.order?.createdAt);

  return {
    status: timeline.currentStatus,
    trackingUrl:
      shipment?.trackingUrl ||
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/track-order?orderId=${shipment.orderId}`,
    awbCode: shipment?.awbCode || null,
    events: timeline.events,
    rawPayload: timeline.rawPayload,
  };
};

const parseShiprocketTrackingPayload = (payload, fallbackTrackingUrl) => {
  const activities = payload?.tracking_data?.shipment_track_activities || [];
  const lastTrack = payload?.tracking_data?.shipment_track?.[0] || {};
  const events = activities
    .map((entry) => ({
      status: mapShiprocketStatusToDeliveryStatus(entry?.sr_status || entry?.activity || ""),
      title: entry?.activity || "Shipment update",
      description: entry?.activity || null,
      location: entry?.location || null,
      eventTime: entry?.date ? new Date(entry.date) : new Date(),
    }))
    .filter((entry) => !Number.isNaN(entry.eventTime.getTime()));

  const latestStatus =
    mapShiprocketStatusToDeliveryStatus(lastTrack?.current_status || "") ||
    events[0]?.status ||
    "IN_TRANSIT";

  return {
    status: latestStatus,
    trackingUrl: lastTrack?.tracking_url || fallbackTrackingUrl || null,
    awbCode: lastTrack?.awb_code || null,
    events,
    rawPayload: payload,
  };
};

export const fetchShiprocketTrackingByAwb = async (shipment) => {
  if (TEST_MODE) return fetchTrackingInTestMode(shipment);
  if (!shipment?.awbCode) throw new Error("AWB_REQUIRED");

  const token = await getShiprocketToken();
  const trackingRes = await axios.get(
    `${SHIPROCKET_BASE_URL}/courier/track/awb/${shipment.awbCode}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );

  return parseShiprocketTrackingPayload(trackingRes.data, shipment.trackingUrl);
};

export {
  TEST_MODE,
  mapShiprocketStatusToDeliveryStatus,
};

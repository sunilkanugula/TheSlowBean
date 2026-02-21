import axios from "axios";

const normalizePhone = (phone) => {
  if (!phone) return "";
  const input = String(phone).trim();
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const sendWhatsApp = async ({ to, message }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v21.0";

  if (!token || !phoneNumberId) {
    console.warn("WHATSAPP CONFIG MISSING: skipping notification");
    return { sent: false, reason: "config_missing" };
  }

  const formattedTo = normalizePhone(to);
  if (!formattedTo) {
    return { sent: false, reason: "invalid_phone" };
  }

  const payload = {
    messaging_product: "whatsapp",
    to: formattedTo,
    type: "text",
    text: {
      body: message || "",
      preview_url: false,
    },
  };

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return { sent: true };
  } catch (err) {
    console.error("META WHATSAPP ERROR:", err?.response?.data || err.message);
    return { sent: false, reason: "meta_error" };
  }
};

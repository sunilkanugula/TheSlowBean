import axios from "axios";

export const sendTelegram = async (message) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("TELEGRAM CONFIG MISSING: skipping notification");
    return { sent: false, reason: "config_missing" };
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      },
      { timeout: 10000 }
    );
    return { sent: true };
  } catch (err) {
    console.error("TELEGRAM SEND ERROR:", err?.response?.data || err.message);
    return { sent: false, reason: "telegram_error" };
  }
};

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.body.password",
      "req.body.oldPassword",
      "req.body.newPassword",
      "req.body.otp",
    ],
    remove: true,
  },
});

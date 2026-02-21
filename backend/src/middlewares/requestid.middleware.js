import { randomUUID } from "crypto";

export const requestId = (req, res, next) => {
  const existingId = req.headers["x-request-id"];
  const reqId =
    typeof existingId === "string" && existingId.trim()
      ? existingId.trim()
      : randomUUID();

  req.requestId = reqId;
  res.setHeader("x-request-id", reqId);
  next();
};

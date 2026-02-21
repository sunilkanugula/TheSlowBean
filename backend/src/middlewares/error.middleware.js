import { logger } from "../utils/logger.js";

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId || "n/a",
  });
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const requestId = req.requestId || req.headers["x-request-id"] || "n/a";

  logger.error({
    requestId,
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    message: err.publicMessage || err.message || "Internal server error",
    requestId,
  });
};

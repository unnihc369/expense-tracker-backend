import { normalizeError } from "../utils/normalize-error.js";

/** 404 for unmatched routes (JSON, not HTML) */
export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl || req.url}`,
    code: "NOT_FOUND",
  });
}

/**
 * Express error-handling middleware (4 arguments).
 * @type {import("express").ErrorRequestHandler}
 */
export function errorHandler(err, req, res, _next) {
  const { status, message, code, details } = normalizeError(err);

  if (status >= 500) {
    console.error("[api]", req.method, req.originalUrl || req.url, err);
  }

  const body = {
    message,
    ...(code && { code }),
    ...(details !== undefined && { details }),
  };

  if (process.env.NODE_ENV !== "production" && status >= 500 && err?.stack) {
    body.stack = err.stack;
  }

  res.status(status).json(body);
}

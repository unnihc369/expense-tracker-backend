import mongoose from "mongoose";
import { HttpError } from "./http-error.js";

/**
 * Maps unknown errors to { status, message, code?, details? } for JSON responses.
 * @param {unknown} err
 * @returns {{ status: number; message: string; code?: string; details?: unknown }}
 */
export function normalizeError(err) {
  if (err instanceof HttpError) {
    return {
      status: err.status,
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(err.details !== undefined && { details: err.details }),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([path, e]) => [path, e.message])
    );
    return {
      status: 400,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return {
      status: 400,
      message: `Invalid ${err.path || "id"}: ${err.value}`,
      code: "INVALID_ID",
    };
  }

  if (err?.name === "MongoServerError" && err.code === 11000) {
    const dupKey = err.keyPattern ? Object.keys(err.keyPattern).join(", ") : "field";
    return {
      status: 409,
      message: `A record with that ${dupKey} already exists`,
      code: "DUPLICATE_KEY",
    };
  }

  if (err?.type === "entity.parse.failed") {
    return {
      status: 400,
      message: "Invalid JSON body",
      code: "INVALID_JSON",
    };
  }

  if (err?.name === "JsonWebTokenError") {
    return {
      status: 401,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    };
  }

  if (err?.name === "TokenExpiredError") {
    return {
      status: 401,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    };
  }

  if (
    err?.name === "MongoServerSelectionError" ||
    err?.name === "MongoNetworkError" ||
    err?.name === "MongoNotConnectedError"
  ) {
    return {
      status: 503,
      message:
        "Database is unavailable. Check that MongoDB is running and MONGO_URI / MONGODB_URI is correct.",
      code: "DB_UNAVAILABLE",
    };
  }

  if (
    typeof err?.message === "string" &&
    err.message.includes("buffering timed out")
  ) {
    return {
      status: 503,
      message:
        "Database did not respond in time. Ensure MongoDB is reachable and MONGO_URI (or MONGODB_URI) is set correctly.",
      code: "DB_BUFFER_TIMEOUT",
    };
  }

  const message =
    typeof err?.message === "string" && err.message.length > 0
      ? err.message
      : "Internal server error";

  return {
    status: 500,
    message,
    code: "INTERNAL_ERROR",
  };
}

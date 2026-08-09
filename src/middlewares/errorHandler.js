import ApiError from "../utils/error.js";
import { logger } from "../utils/logger.js";

export default function errorHandler(err, req, res, next) {
  if (req.aborted || err.message === "Request aborted") {
    return res.status(499).json({
      success: false,
      data: null,
      message: "Upload was cancelled before completion",
    });
  }

  logger("error", "Unhandled exception", {
    message: err.message,
    stack: err.stack,
  });

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      data: err.errors,
      message: err.errors[0] || "Internal Server Error",
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    data: null,
    message: err.message || "Internal Server Error",
  });
}

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as userRepository from "../repository/user.repository.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function unauthorized(res, { code = "UNAUTHORIZED", message = "Unauthorized" } = {}) {
  return res.status(401).json({
    success: false,
    data: null,
    code,
    message,
  });
}

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized(res, {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepository.findUserById(decoded.id);
    if (!user) {
      return unauthorized(res, {
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    logger("auth", "JWT validation failed", { error: err.message });

    const isExpired = err?.name === "TokenExpiredError";
    return unauthorized(res, {
      code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: isExpired
        ? "Token expired"
        : "Invalid or expired token",
    });
  }
}

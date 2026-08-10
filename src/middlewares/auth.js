import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as customerRepository from "../repository/customer.repository.js";
import * as businessRepository from "../repository/business.repository.js";
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

    // Determine which repository to use based on userType
    let user;
    const repo = decoded.userType === "customer" 
      ? customerRepository 
      : businessRepository;

    // Try to find user in the appropriate collection
    if (decoded.userType === "customer") {
      user = await customerRepository.findCustomerById(decoded.id);
    } else if (decoded.userType === "business") {
      user = await businessRepository.findBusinessById(decoded.id);
    }

    if (!user) {
      return unauthorized(res, {
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    // Attach user info to request with userType
    req.user = {
      id: decoded.id,
      userType: decoded.userType,
      email: decoded.email,
      ...user,
    };

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

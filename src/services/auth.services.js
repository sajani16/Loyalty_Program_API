import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as customerRepo from "../repository/customer.repository.js";
import * as businessRepo from "../repository/business.repository.js";
import * as roleRepo from "../repository/role.repository.js";
import { logger } from "../utils/logger.js";
import { sendOTPEmailNow } from "../services/email.service.js";
import { OTP_CONFIG } from "../config/otp.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const RESET_TOKEN_TTL_MINUTES =
  parseInt(process.env.RESET_PASSWORD_TTL_MINUTES, 10) || 30;

/**
 * Register a new user (customer or business)
 * Creates the appropriate document based on userType
 */
export const register = async ({ userType, name, email, password, phone }) => {
  // Validate userType
  if (!["customer", "business"].includes(userType)) {
    const error = new Error(
      "Invalid userType. Must be 'customer' or 'business'",
    );
    error.status = 400;
    throw error;
  }

  // Get the appropriate repository based on userType
  const repo = userType === "customer" ? customerRepo : businessRepo;

  const defaultRoleName = userType === "customer" ? "customer" : "business";
  const defaultRole = await roleRepo.findRoleByName(defaultRoleName);
  if (!defaultRole) {
    const error = new Error(
      `Default ${defaultRoleName} role not found. Run the role seed first.`,
    );
    error.status = 400;
    logger("auth", "Registration failed - default role missing", {
      email,
      userType,
      defaultRoleName,
    });
    throw error;
  }

  // Check if email already exists
  const existingUser = await repo.findUserByEmail(email);
  if (existingUser) {
    const error = new Error(
      "Email is already registered. Please use a different email or login.",
    );
    error.status = 409;
    logger("auth", "Registration failed - email already exists", {
      email,
      userType,
    });
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger("auth", "OTP generated for registration", { email, userType, otp });

  // Create user
  const createFunc =
    userType === "customer"
      ? customerRepo.createCustomer
      : businessRepo.createBusiness;

  const created = await createFunc({
    name,
    email,
    password: hashedPassword,
    phone: phone && phone.trim() ? phone.trim() : undefined,
    role: defaultRole._id,
    otp,
    otpExpires,
    isVerified: false,
  });

  // Send OTP email
  try {
    await sendOTPEmailNow({
      email: created.email,
      name: created.name,
      otp,
      purpose: "verification",
    });
    logger("auth", "OTP email sent", { email, userType });
  } catch (emailError) {
    logger("auth", "Failed to send OTP email", {
      email,
      userType,
      error: emailError.message,
    });
    // Continue even if email fails - user can resend OTP
  }

  logger("auth", "User registered", { email, userType });

  return {
    success: true,
    data: { id: created._id, email: created.email, name: created.name },
    message:
      "Registration successful. Please verify your email with the OTP sent.",
  };
};

/**
 * Login user - determines userType by checking both collections
 * Returns JWT token with userType in payload
 */
export const login = async ({ email, password }) => {
  // Check in customer collection first
  let user = await customerRepo.findCustomerByEmail(email);
  let userType = "customer";

  // If not found, check in business collection
  if (!user) {
    user = await businessRepo.findBusinessByEmail(email);
    userType = "business";
  }

  // User not found in either collection
  if (!user) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    logger("auth", "Login failed - user not found", { email });
    throw error;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    logger("auth", "Login failed - invalid password", { email, userType });
    throw error;
  }

  // Check if email is verified
  if (!user.isVerified) {
    const error = new Error("Email not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    error.status = 403;
    error.email = user.email;
    logger("auth", "Login failed - email not verified", { email, userType });
    throw error;
  }

  // Check if account is active
  if (user.status !== "active") {
    const error = new Error("Account is inactive");
    error.code = "ACCOUNT_INACTIVE";
    error.status = 403;
    logger("auth", "Login failed - account inactive", { email, userType });
    throw error;
  }

  // Generate JWT token with userType
  const token = jwt.sign(
    { id: user._id.toString(), userType, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  const userData = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    userType,
  };

  logger("auth", "User logged in", { email, userType });

  return {
    success: true,
    data: {
      accessToken: token,
      user: userData,
    },
    message: "Login successful",
  };
};

/**
 * Verify OTP for email verification
 */
export const verifyOtp = async ({ email, otp }) => {
  // Check in both collections
  let user = await customerRepo.findCustomerByEmail(email);
  let userType = "customer";

  if (!user) {
    user = await businessRepo.findBusinessByEmail(email);
    userType = "business";
  }

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    logger("auth", "OTP verification failed - user not found", { email });
    throw error;
  }

  if (user.isVerified) {
    logger("auth", "OTP verification - already verified", { email, userType });
    return {
      success: true,
      data: null,
      message: "Email already verified",
    };
  }

  if (!user.otp || !user.otpExpires) {
    const error = new Error("No OTP found. Please request a new one.");
    error.status = 400;
    logger("auth", "OTP verification failed - no OTP", { email, userType });
    throw error;
  }

  if (new Date() > user.otpExpires) {
    const error = new Error("OTP has expired. Please request a new one.");
    error.status = 400;
    logger("auth", "OTP verification failed - expired", { email, userType });
    throw error;
  }

  if (user.otp !== otp) {
    const error = new Error("Invalid OTP");
    error.status = 400;
    logger("auth", "OTP verification failed - invalid OTP", {
      email,
      userType,
    });
    throw error;
  }

  // Update user as verified
  const repo = userType === "customer" ? customerRepo : businessRepo;
  await repo.updateUser(user._id, {
    isVerified: true,
    otp: null,
    otpExpires: null,
  });

  logger("auth", "OTP verified successfully", { email, userType });

  return {
    success: true,
    data: null,
    message: "Email verified successfully",
  };
};

/**
 * Resend OTP
 */
export const resendOtp = async ({ email }) => {
  // Check in both collections
  let user = await customerRepo.findCustomerByEmail(email);
  let userType = "customer";

  if (!user) {
    user = await businessRepo.findBusinessByEmail(email);
    userType = "business";
  }

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    logger("auth", "Resend OTP failed - user not found", { email });
    throw error;
  }

  if (user.isVerified) {
    logger("auth", "Resend OTP - already verified", { email, userType });
    return {
      success: true,
      data: null,
      message: "Email already verified",
    };
  }

  // Generate new OTP
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger("auth", "OTP generated for resend", { email, userType, otp });

  // Update user
  const repo = userType === "customer" ? customerRepo : businessRepo;
  await repo.updateUser(user._id, { otp, otpExpires });

  // Send OTP email
  try {
    await sendOTPEmailNow({
      email: user.email,
      name: user.name,
      otp,
      purpose: "verification",
    });
    logger("auth", "OTP resent successfully", { email, userType });
  } catch (emailError) {
    logger("auth", "Failed to resend OTP email", {
      email,
      userType,
      error: emailError.message,
    });
    throw new Error("Failed to send OTP email");
  }

  return {
    success: true,
    data: null,
    message: "New OTP sent to your email",
  };
};

/**
 * Forgot password - initiate password reset
 */
export const forgotPassword = async ({ email }) => {
  // Check in both collections
  let user = await customerRepo.findCustomerByEmail(email);
  let userType = "customer";

  if (!user) {
    user = await businessRepo.findBusinessByEmail(email);
    userType = "business";
  }

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    logger("auth", "Forgot password failed - user not found", { email });
    throw error;
  }

  // Generate OTP for password reset
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger("auth", "OTP generated for password reset", { email, userType, otp });

  // Update user
  const repo = userType === "customer" ? customerRepo : businessRepo;
  await repo.updateUser(user._id, { otp, otpExpires });

  // Send OTP email
  try {
    await sendOTPEmailNow({
      email: user.email,
      name: user.name,
      otp,
      purpose: "reset",
    });
    logger("auth", "Password reset OTP sent", { email, userType });
  } catch (emailError) {
    logger("auth", "Failed to send password reset OTP", {
      email,
      userType,
      error: emailError.message,
    });
  }

  return {
    success: true,
    data: null,
    message: "Password reset code has been sent to your email",
  };
};

/**
 * Verify reset OTP and generate reset token
 */
export const verifyResetOtp = async ({ email, otp }) => {
  // Check in both collections
  let user = await customerRepo.findCustomerByEmail(email);
  let userType = "customer";

  if (!user) {
    user = await businessRepo.findBusinessByEmail(email);
    userType = "business";
  }

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    logger("auth", "Reset OTP verification failed - user not found", { email });
    throw error;
  }

  if (!user.otp || !user.otpExpires) {
    const error = new Error("No OTP found. Please request a new one.");
    error.status = 400;
    logger("auth", "Reset OTP verification failed - no OTP", {
      email,
      userType,
    });
    throw error;
  }

  if (new Date() > user.otpExpires) {
    const error = new Error("OTP has expired. Please request a new one.");
    error.status = 400;
    logger("auth", "Reset OTP verification failed - expired", {
      email,
      userType,
    });
    throw error;
  }

  if (user.otp !== otp) {
    const error = new Error("Invalid OTP");
    error.status = 400;
    logger("auth", "Reset OTP verification failed - invalid OTP", {
      email,
      userType,
    });
    throw error;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpires = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  // Update user
  const repo = userType === "customer" ? customerRepo : businessRepo;
  await repo.updateUser(user._id, {
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires,
    otp: null,
    otpExpires: null,
  });

  logger("auth", "Reset OTP verified successfully", { email, userType });

  return {
    success: true,
    data: { resetToken },
    message: "OTP verified. You can now reset your password.",
  };
};

/**
 * Reset password with token
 */
export const resetPassword = async ({ token, newPassword }) => {
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Check in both collections
  let user = await customerRepo.findCustomerByResetToken(resetTokenHash);
  let userType = "customer";

  if (!user) {
    user = await businessRepo.findBusinessByResetToken(resetTokenHash);
    userType = "business";
  }

  if (!user) {
    const error = new Error("Invalid or expired reset token");
    error.status = 400;
    logger("auth", "Reset password failed - invalid token");
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const repo = userType === "customer" ? customerRepo : businessRepo;
  await repo.updateUser(user._id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  logger("auth", "Password reset successful", { email: user.email, userType });

  return {
    success: true,
    data: null,
    message: "Password reset successfully",
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async ({ refreshToken }) => {
  if (!refreshToken) {
    const error = new Error("Refresh token is required");
    error.status = 400;
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, JWT_SECRET, { ignoreExpiration: false });
  } catch (err) {
    const error = new Error("Invalid or expired refresh token");
    error.status = 401;
    throw error;
  }

  // Get user
  const repo = payload.userType === "customer" ? customerRepo : businessRepo;
  const user = await repo.findUserById(payload.id);

  if (!user || user.isDeleted) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error("Email not verified");
    error.status = 403;
    throw error;
  }

  // Generate new access token
  const newAccessToken = jwt.sign(
    { id: user._id.toString(), userType: payload.userType, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );

  logger("auth", "Access token refreshed", {
    userId: user._id,
    userType: payload.userType,
  });

  return {
    success: true,
    data: {
      accessToken: newAccessToken,
    },
    message: "Token refreshed successfully",
  };
};

/**
 * Logout
 * Note: Since we're using JWT, logout is handled on the client side.
 * In production, consider implementing token blacklisting or Redis-based token management.
 */
export const logout = async ({ userId, userType }) => {
  // With JWT, the token is invalidated on the client by removing it
  // In a production system, you would add the token to a blacklist (Redis, database, etc.)

  logger("auth", "User logged out", { userId, userType });

  return {
    success: true,
    data: null,
    message: "Logout successful",
  };
};

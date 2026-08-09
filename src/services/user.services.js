import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import * as userRepo from "../repository/user.repository.js";
import { logger } from "../utils/logger.js";
import { sendOTPEmailNow } from "../services/email.service.js";
import { OTP_CONFIG } from "../config/otp.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const RESET_TOKEN_TTL_MINUTES =
  parseInt(process.env.RESET_PASSWORD_TTL_MINUTES, 10) || 30;

export const registerUser = async ({
  name,
  email,
  password,
  phone,
  location,
}) => {

  // Check if email already exists
  const existingUser = await userRepo.findUserByEmail(email);
  if (existingUser) {
    logger("user", "Registration failed - email already exists", { email });
    throw new Error(
      "This email is already registered with us. Please login or use a different email.",
    );
  }
  // Only check phone uniqueness if a phone was actually provided
  if (phone && phone.trim()) {
    const existingPhone = await userRepo.findUserByPhone(phone.trim());
    if (existingPhone) {
      throw new Error(
        "This phone number is already registered. Please use a different number.",
      );
    }
  }

  let hashed;
  if (password) hashed = await bcrypt.hash(password, 10);

  // Generate OTP using config
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger("user", "OTP generated for registration", { email, otp });

  const created = await userRepo.createUser({
    name,
    email,
    password: hashed,
    phone: phone && phone.trim() ? phone.trim() : undefined,
    location,
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
    logger("user", "OTP email sent", { email: created.email });
  } catch (emailError) {
    logger("user", "Failed to send OTP email", {
      email: created.email,
      error: emailError.message,
    });
  }
  // system notification
 
  logger("user", "User registered", { user: created.email });
  return {
    success: true,
    data: { id: created._id, email: created.email, name: created.name },
    message: "User created. Please verify your email with the OTP sent.",
  };

}
export async function verifyOTP({ email, otp }) {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    logger("user", "OTP verification failed - user not found", { email });
    throw new Error("User not found");
  }

  if (user.isVerified) {
    logger("user", "OTP verification - already verified", { email });
    return {
      success: true,
      data: null,
      message: "Email already verified",
    };
  }

  if (!user.otp || !user.otpExpires) {
    logger("user", "OTP verification failed - no OTP found", { email });
    throw new Error("No OTP found. Please request a new one.");
  }

  if (new Date() > user.otpExpires) {
    logger("user", "OTP verification failed - expired", { email });
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (user.otp !== otp) {
    logger("user", "OTP verification failed - invalid OTP", { email });
    throw new Error("Invalid OTP");
  }

  // Mark user as verified and clear OTP
  await userRepo.updateUser(user._id, {
    isVerified: true,
    otp: null,
    otpExpires: null,
  });
  //system notification
 
  logger("user", "OTP verified successfully", { email });
  return {
    success: true,
    data: null,
    message: "Email verified successfully",
  };
}

export async function resendOTP({ email }) {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    logger("user", "Resend OTP failed - user not found", { email });
    throw new Error("User not found");
  }

  if (user.isVerified) {
    logger("user", "Resend OTP - already verified", { email });
    return {
      success: true,
      data: null,
      message: "Email already verified",
    };
  }

  // Generate new OTP using config
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger("user", "OTP generated for resend", { email, otp });

  await userRepo.updateUser(user._id, {
    otp,
    otpExpires,
  });

  // Send OTP email
  try {
    await sendOTPEmailNow({
      email: user.email,
      name: user.name,
      otp,
      purpose: "verification",
    });
    logger("user", "OTP resent successfully", { email });
  } catch (emailError) {
    logger("user", "Failed to resend OTP email", {
      email,
      error: emailError.message,
    });
    throw new Error("Failed to send OTP email");
  }

  return {
    success: true,
    data: null,
    message: "New OTP sent to your email",
  };
}

export async function loginUser({ email, password }) {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  // Check if user is verified
  if (!user.isVerified) {
    const error = new Error("Email not verified");
    error.code = "EMAIL_NOT_VERIFIED";
    error.status = 403;
    error.email = user.email;
    throw error;
  }

  // Check if 2FA is enabled — signal frontend to prompt TOTP
  if (user.twoFactorEnabled) {
    const error = new Error("2FA required");
    error.code = "TWO_FACTOR_REQUIRED";
    error.status = 200;
    error.userId = user._id.toString();
    throw error;
  }

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
  };

  logger("auth", "User logged in", { user: email });
  return {
    success: true,
    data: { token, user: userData },
    message: "Login successful",
  };
}

export async function refreshAccessToken(bearerToken) {
  if (!bearerToken) {
    const error = new Error("Unauthorized");
    error.status = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  let payload;
  try {
    payload = jwt.verify(bearerToken, JWT_SECRET, { ignoreExpiration: true });
  } catch {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    error.code = "INVALID_TOKEN";
    throw error;
  }

  const user = await userRepo.findUserById(payload.id);
  if (!user || user.isDeleted) {
    const error = new Error("Unauthorized");
    error.status = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error("Email not verified");
    error.status = 403;
    throw error;
  }

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      _id: user._id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function getUsers(filter, options) {
  const result = await userRepo.listUsers(filter, options);
  return result;
}

export async function getUsersDropdown(filter) {
  const users = await userRepo.listUsersDropdown(filter);
  return users;
}

export async function updateUserService(id, update) {
  if (update.password) {
    update.password = await bcrypt.hash(update.password, 10);
  }
  const updated = await userRepo.updateUser(id, update);
  logger("user", "User updated", { userId: id });
  return updated;
}

export async function deleteUserService(id) {
  const deleted = await userRepo.deleteUser(id);
  logger("user", "User deleted", { userId: id });
  return deleted;
}

export async function getProfileService(userId) {
  const user = await userRepo.findUserById(userId);
  if (!user) throw new Error("User not found");

  return user;
}

export async function updateProfileService(userId, updateData) {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    logger("user", "Profile update failed - user not found", { userId });
    throw new Error("User not found");
  }

  // Check if email is being changed and if it's already taken
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await userRepo.findUserByEmail(updateData.email);
    if (existingUser) {
      logger("user", "Profile update failed - email already exists", {
        userId,
        email: updateData.email,
      });
      throw new Error("Email already in use");
    }
  }

  const updatedUser = await userRepo.updateUser(userId, updateData);
  logger("user", "Profile updated successfully", { userId });
  return updatedUser;
}

export async function changePassword(userId, oldPassword, newPassword) {
  const user = await userRepo.findUserByIdWithPw(userId);
  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error("Old password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepo.updateUser(userId, { password: hashed });

  logger("user", "Password changed", { userId });
  return {
    success: true,
    data: null,
    message: "Password changed successfully",
  };
}

export async function forgotPassword(email) {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    logger("user", "Forgot password - user not found", { email });
    throw new Error(
      "This email is not registered with us. Please check and try again.",
    );
  }

  // Generate OTP for password reset using config
  const otp = OTP_CONFIG.generate();
  const otpExpires = OTP_CONFIG.getExpirationDate();

  logger({ email, otp });

  await userRepo.updateUser(user._id, {
    otp,
    otpExpires,
  });

  // Send OTP email
  try {
    await sendOTPEmailNow({
      email: user.email,
      name: user.name,
      otp,
      purpose: "reset",
    });
    logger("user", "Password reset OTP sent");
  } catch (emailError) {
    logger("user", "Failed to send password reset OTP", {
      email: user.email,
      error: emailError.message,
    });
  }

  return {
    success: true,
    data: null,
    message: "Reset code has been sent to your email",
  };
}

export async function verifyResetOTP({ email, otp }) {
  const user = await userRepo.findUserByEmail(email);

  if (!user) {
    logger("user", "Reset OTP verification failed - user not found", { email });
    throw new Error("User not found");
  }

  if (!user.otp || !user.otpExpires) {
    logger("user", "Reset OTP verification failed - no OTP found", { email });
    throw new Error("No OTP found. Please request a new one.");
  }

  if (new Date() > user.otpExpires) {
    logger("user", "Reset OTP verification failed - expired", { email });
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (user.otp !== otp) {
    logger("user", "Reset OTP verification failed - invalid OTP", { email });
    throw new Error("Invalid OTP");
  }

  // Generate reset token after OTP verification
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetPasswordExpires = new Date(
    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000,
  );

  await userRepo.updateUser(user._id, {
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires,
    otp: null,
    otpExpires: null,
  });

  logger("user", "Reset OTP verified successfully");
  return {
    success: true,
    data: { resetToken },
    message: "OTP verified. You can now reset your password.",
  };
}

export async function resetPassword({ token, newPassword }) {
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await userRepo.findUserByResetToken(resetTokenHash);
  if (!user) throw new Error("Invalid or expired reset token");

  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepo.updateUser(user._id, {
    password: hashed,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  });

  logger("user", "Password reset successful");

  return {
    success: true,
    data: null,
    message: "Password reset successfully",
  };
}

export async function findUserByIdService(id) {
  const user = await userRepo.findUserById(id);
  if (!user) throw new Error("User not found");

  return user;
}

export async function getAllUsersForDropdownService(filter) {
  const users = await userRepo.getAllUsersForDropdown(filter);
  return users;
}


export async function resendResetOtp(email) {
  return forgotPassword(email);
}

// OTP Service Functions
export async function verifyOtpService(email, otp) {
  return await verifyOTP({ email, otp });
}

export async function resendOtpService(email) {
  return await resendOTP({ email });
}

export async function verifyResetOtpService(email, otp) {
  return verifyResetOTP({ email, otp });
}

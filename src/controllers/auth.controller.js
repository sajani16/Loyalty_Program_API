import * as authService from "../services/auth.services.js";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from "../validations/auth.validations.js";

/**
 * POST /auth/register
 * Public registration for Business or Customer (with OTP verification required)
 */
export const register = async (req, res, next) => {
  try {
    const validatedData = await registerSchema.validate(req.body);
    const result = await authService.register(validatedData);
    res.status(201).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/login
 * Common login for all account types (customer, business, user/admin)
 * Returns JWT token with userType
 */
export const login = async (req, res, next) => {
  try {
    const validatedData = await loginSchema.validate(req.body);
    const result = await authService.login(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        ...(err.code && { code: err.code }),
        ...(err.email && { email: err.email }),
      });
    }
    next(err);
  }
};

/**
 * POST /auth/verify-otp
 * Verify OTP for email verification during registration
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const validatedData = await verifyOtpSchema.validate(req.body);
    const result = await authService.verifyOtp(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/resend-otp
 * Resend OTP for email verification
 */
export const resendOtp = async (req, res, next) => {
  try {
    const validatedData = await resendOtpSchema.validate(req.body);
    const result = await authService.resendOtp(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/forgot-password
 * Initiate password reset
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const validatedData = await forgotPasswordSchema.validate(req.body);
    const result = await authService.forgotPassword(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/verify-reset-otp
 * Verify OTP for password reset
 */
export const verifyResetOtp = async (req, res, next) => {
  try {
    const validatedData = await verifyResetOtpSchema.validate(req.body);
    const result = await authService.verifyResetOtp(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/reset-password
 * Reset password with token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const validatedData = await resetPasswordSchema.validate(req.body);
    const result = await authService.resetPassword(validatedData);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token (for future implementation with refresh tokens)
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken({ refreshToken });
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /auth/logout
 * Logout user (JWT invalidation on client side)
 */
export const logout = async (req, res, next) => {
  try {
    const { id: userId, userType } = req.user;
    const result = await authService.logout({ userId, userType });
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

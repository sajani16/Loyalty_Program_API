import express from "express";
import * as authController from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js";

const authRoutes = express.Router();

// Public routes - Self registration (with OTP)
authRoutes.post("/register", authController.register);

// Public routes - Authentication
authRoutes.post("/login", authController.login);
authRoutes.post("/verify-otp", authController.verifyOtp);
authRoutes.post("/resend-otp", authController.resendOtp);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/verify-reset-otp", authController.verifyResetOtp);
authRoutes.post("/reset-password", authController.resetPassword);
authRoutes.post("/refresh", authController.refresh);

// Protected routes
authRoutes.post("/logout", auth, authController.logout);

export default authRoutes;

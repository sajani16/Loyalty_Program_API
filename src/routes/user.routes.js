import express from "express";
import auth from "../middlewares/auth.js";
// import { uploadImg } from "../middlewares/upload.js";
import * as userController from "../controllers/user.controller.js";

const userRoutes = express.Router();

userRoutes.post("/auth/register", userController.register);
userRoutes.post("/auth/login", userController.login);
userRoutes.post("/auth/verify-otp", userController.verifyOtp);
userRoutes.post("/auth/resend-otp", userController.resendOtp);
userRoutes.post("/auth/forgot-password", userController.forgotPassword);
userRoutes.post("/auth/resend-reset-otp", userController.resendResetOtp);
userRoutes.post("/auth/verify-reset-otp", userController.verifyResetOtp);
userRoutes.post("/auth/reset-password", userController.resetPassword);
userRoutes.get("/profile", auth, userController.getProfile);
userRoutes.get("/user-info", auth, userController.getProfile);
userRoutes.put("/user-info", auth, userController.updateProfile);
userRoutes.post("/change-password", auth, userController.changePassword);
userRoutes.get("/get-all", auth, userController.listUsers);
userRoutes.get("/:id", auth, userController.getUserById);
userRoutes.put("/:id", auth, userController.updateUser);
userRoutes.delete("/:id", auth, userController.deleteUser);


export default userRoutes;

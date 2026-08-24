import express from "express";
import * as customerController from "../controllers/customer.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { uploadImage } from "../middlewares/upload.js";

const customerRoutes = express.Router();

// Customer routes - Self management (MUST come before /:id routes)
customerRoutes.get("/me", auth, requireRole("customer"), customerController.getMyCustomer);

customerRoutes.put("/me", auth, requireRole("customer"), customerController.updateMyCustomer);

customerRoutes.put("/me/profile-image", auth, requireRole("customer"), uploadImage.single("profileImage"), customerController.updateProfileImage);

customerRoutes.post("/me/change-password", auth, requireRole("customer"), customerController.changePassword);

customerRoutes.get("/me/activity-history", auth, requireRole("customer"), customerController.getActivityHistory);

// Business routes - Create and manage customers
customerRoutes.post(
  "/",
  auth,
  requireRole("business"),
  customerController.createCustomer,
);

customerRoutes.get(
  "/",
  auth,
  requireRole("business"),
  customerController.listCustomers,
);

customerRoutes.get(
  "/:id",
  auth,
  customerController.getCustomerById,
);

customerRoutes.put(
  "/:id",
  auth,
  customerController.updateCustomer,
);

customerRoutes.delete(
  "/:id",
  auth,
  requireRole("business"),
  customerController.deleteCustomer,
);

export default customerRoutes;

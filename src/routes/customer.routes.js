import express from "express";
import * as customerController from "../controllers/customer.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const customerRoutes = express.Router();

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

// Customer routes - Self management
customerRoutes.get("/me", auth, requireRole("customer"), customerController.getMyCustomer);

customerRoutes.put("/me", auth, requireRole("customer"), customerController.updateMyCustomer);

export default customerRoutes;

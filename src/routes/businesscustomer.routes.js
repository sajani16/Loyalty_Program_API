import express from "express";
import * as bcController from "../controllers/businesscustomer.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const bcRoutes = express.Router();

// ============ CUSTOMER ROUTES ============
// Specific routes first (before catch-all :id)
bcRoutes.post(
  "/join/:businessId",
  auth,
  requireRole("customer"),
  bcController.joinBusiness,
);

bcRoutes.get(
  "/cards",
  auth,
  requireRole("customer"),
  bcController.getCustomerBusinessCards,
);

bcRoutes.get(
  "/",
  auth,
  requireRole("customer"),
  bcController.getCustomerMemberships,
);

bcRoutes.get(
  "/:id",
  auth,
  requireRole("customer"),
  bcController.getCustomerMembership,
);

// ============ BUSINESS ROUTES ============
// Specific routes first (before catch-all :id)
bcRoutes.patch(
  "/business/customers/:id/approve",
  auth,
  requireRole("business"),
  bcController.approveMembership,
);

bcRoutes.patch(
  "/business/customers/:id/reject",
  auth,
  requireRole("business"),
  bcController.rejectMembership,
);

bcRoutes.get(
  "/business/customers/:id",
  auth,
  requireRole("business"),
  bcController.getBusinessCustomerMembership,
);

bcRoutes.get(
  "/business/customers",
  auth,
  requireRole("business"),
  bcController.getBusinessCustomers,
);

export default bcRoutes;

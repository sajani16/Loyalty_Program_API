import express from "express";
import * as loyaltyController from "../controllers/loyaltyrequest.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const loyaltyRoutes = express.Router();

// ============ CUSTOMER ROUTES ============
// QR Scan: Customer initiates loyalty request (WebSocket notifies merchant)
loyaltyRoutes.post(
  "/qr-scan/:businessId",
  auth,
  requireRole("customer"),
  loyaltyController.createQuickLoyaltyRequestViaQR,
);

// Get loyalty requests for a business customer (Customer view)
loyaltyRoutes.get(
  "/customer/:businessCustomerId",
  auth,
  requireRole("customer"),
  loyaltyController.getCustomerLoyaltyRequests,
);

// Get loyalty statistics for a business customer
loyaltyRoutes.get(
  "/stats/:businessCustomerId",
  auth,
  loyaltyController.getLoyaltyStats,
);

// ============ BUSINESS ROUTES ============
// Merchant adds products to pending request
loyaltyRoutes.patch(
  "/:id/add-products",
  auth,
  requireRole("business"),
  loyaltyController.addProductsToLoyaltyRequest,
);

// Merchant gets pending requests for their business
loyaltyRoutes.get(
  "/business/all",
  auth,
  requireRole("business"),
  loyaltyController.getBusinessLoyaltyRequests,
);

// Complete loyalty request (Merchant processes & awards loyalty)
loyaltyRoutes.patch(
  "/:id/complete",
  auth,
  requireRole("business"),
  loyaltyController.completeLoyaltyRequest,
);

// Reject loyalty request
loyaltyRoutes.patch(
  "/:id/reject",
  auth,
  requireRole("business"),
  loyaltyController.rejectLoyaltyRequest,
);

// ============ COMMON ROUTES ============
// Get specific loyalty request
loyaltyRoutes.get(
  "/:id",
  auth,
  loyaltyController.getLoyaltyRequest,
);

export default loyaltyRoutes;

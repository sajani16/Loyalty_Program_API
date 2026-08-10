import express from "express";
import * as businessController from "../controllers/business.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const businessRoutes = express.Router();

// Admin routes - Create and manage businesses
businessRoutes.post(
  "/",
  auth,
  requireRole("admin", "superadmin"),
  businessController.createBusiness,
);

businessRoutes.get(
  "/",
  auth,
  requireRole("admin", "superadmin"),
  businessController.listBusinesses,
);

businessRoutes.get(
  "/:id",
  auth,
  requireRole("admin", "superadmin"),
  businessController.getBusinessById,
);

businessRoutes.put(
  "/:id",
  auth,
  requireRole("admin", "superadmin"),
  businessController.updateBusiness,
);

businessRoutes.delete(
  "/:id",
  auth,
  requireRole("admin", "superadmin"),
  businessController.deleteBusiness,
);

// Business routes - Self management
businessRoutes.get("/me", auth, requireRole("business"), businessController.getMyBusiness);

businessRoutes.put("/me", auth, requireRole("business"), businessController.updateMyBusiness);

export default businessRoutes;

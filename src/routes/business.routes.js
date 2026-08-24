import express from "express";
import * as businessController from "../controllers/business.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { uploadImage } from "../middlewares/upload.js";

const businessRoutes = express.Router();

// Business routes - Create and manage businesses
businessRoutes.post(
  "/",
  auth,
  requireRole("business"),
  businessController.createBusiness,
);

businessRoutes.get(
  "/",
  auth,
  requireRole("business"),
  businessController.listBusinesses,
);

// Business routes - Self management (MUST come before /:id routes)
businessRoutes.get("/me", auth, businessController.getMyBusiness);

businessRoutes.put("/me", auth, businessController.updateMyBusiness);

businessRoutes.put("/me/logo", auth, uploadImage.single("businessLogo"), businessController.updateBusinessLogo);

businessRoutes.post("/me/change-password", auth, businessController.changePassword);

// Generic ID routes
businessRoutes.get(
  "/:id",
  auth,
  requireRole("business"),
  businessController.getBusinessById,
);

businessRoutes.put(
  "/:id",
  auth,
  requireRole("business"),
  businessController.updateBusiness,
);

businessRoutes.delete(
  "/:id",
  auth,
  requireRole("business"),
  businessController.deleteBusiness,
);

export default businessRoutes;

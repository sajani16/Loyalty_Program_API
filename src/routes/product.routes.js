import express from "express";
import * as productController from "../controllers/product.controller.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const productRoutes = express.Router();

// All routes require authentication and business role
productRoutes.use(auth, requireRole("business"));

// ============ BUSINESS PRODUCT ROUTES ============
// Create product
productRoutes.post(
  "/",
  productController.createProduct,
);

// Get only ACTIVE products for dropdowns
productRoutes.get(
  "/dropdown/active",
  productController.getActiveProductsForDropdown,
);

// Get stamp-eligible products
productRoutes.get(
  "/stamps/eligible",
  productController.getStampEligibleProducts,
);

// Get all business products (active + inactive)
productRoutes.get(
  "/",
  productController.getBusinessProducts,
);

// Get specific product
productRoutes.get(
  "/:id",
  productController.getProduct,
);

// Update product
productRoutes.patch(
  "/:id",
  productController.updateProduct,
);

// Toggle product status
productRoutes.patch(
  "/:id/toggle",
  productController.toggleProductStatus,
);

// Delete product
productRoutes.delete(
  "/:id",
  productController.deleteProduct,
);

export default productRoutes;

import * as productService from "../services/product.services.js";
import { validateProductInput } from "../validations/product.validations.js";

/**
 * POST /api/products
 * Create a new product (Business only)
 */
export const createProduct = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { error, value } = validateProductInput(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const result = await productService.createProduct(businessId, value);
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
 * GET /api/products/:id
 * Get product by ID
 */
export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await productService.getProduct(id);
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
 * GET /api/products
 * Get all products for authenticated business (active + inactive)
 */
export const getBusinessProducts = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await productService.getBusinessProducts(
      businessId,
       // undefined = all products (active + inactive)
      parseInt(page),
      parseInt(limit),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/dropdown/active
 * Get only ACTIVE products for dropdowns (Business only)
 */
export const getActiveProductsForDropdown = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const result = await productService.getActiveProductsForDropdown(businessId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/stamps/eligible
 * Get stamp-eligible products for authenticated business
 */
export const getStampEligibleProducts = async (req, res, next) => {
  try {
    const businessId = req.user.id;

    const result = await productService.getStampEligibleProducts(businessId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id
 * Update product (Business only)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;

    const result = await productService.updateProduct(businessId, id, req.body);
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
 * DELETE /api/products/:id
 * Delete product (Business only)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;

    const result = await productService.deleteProduct(businessId, id);
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
 * PATCH /api/products/:id/toggle
 * Toggle product active status (Business only)
 */
export const toggleProductStatus = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const result = await productService.toggleProductStatus(businessId, id, isActive);
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

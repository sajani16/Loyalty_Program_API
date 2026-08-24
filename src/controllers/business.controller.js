import * as businessService from "../services/business.services.js";
import { businessSchema } from "../validations/business.validations.js";

/**
 * POST /api/businesses
 * Create a new business (Admin only)
 */
export const createBusiness = async (req, res, next) => {
  try {
    const validatedData = await businessSchema.validate(req.body);
    const result = await businessService.createBusiness(validatedData);
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
 * GET /api/businesses
 * List all businesses (Admin only)
 */
export const listBusinesses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const result = await businessService.listBusinesses({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/businesses/:id
 * Get business by ID
 */
export const getBusinessById = async (req, res, next) => {
  try {
    const result = await businessService.getBusinessById(req.params.id);
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
 * PUT /api/businesses/:id
 * Update business (Admin or Business itself)
 */
export const updateBusiness = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Check authorization: only admin or the business itself can update
    if (userType !== "user" && userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - cannot update other business accounts",
      });
    }

    const result = await businessService.updateBusiness(id, req.body);
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
 * DELETE /api/businesses/:id
 * Delete/Deactivate business (Admin only)
 */
export const deleteBusiness = async (req, res, next) => {
  try {
    const result = await businessService.deleteBusiness(req.params.id);
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
 * GET /api/me/business
 * Get current business profile (Business only)
 */
export const getMyBusiness = async (req, res, next) => {
  try {
    const result = await businessService.getBusinessById(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/me/business
 * Update own business profile (Business only)
 */
export const updateMyBusiness = async (req, res, next) => {
  try {
    const result = await businessService.updateBusiness(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/me/business/logo
 * Update business logo (Business only)
 */
export const updateBusinessLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Use 'path' instead of 'secure_url' for Cloudinary storage
    const logoUrl = req.file.secure_url || req.file.path;
    const result = await businessService.updateBusiness(req.user.id, {
      businessLogo: logoUrl,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/me/business/change-password
 * Change business password (Business only)
 */
export const changePassword = async (req, res, next) => {
  try {
    const result = await businessService.changePassword(
      req.user.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
      });
    }
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

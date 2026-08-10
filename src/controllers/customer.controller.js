import * as customerService from "../services/customer.services.js";
import { customerSchema } from "../validations/customer.validations.js";

/**
 * POST /api/customers
 * Create a new customer (Business only)
 */
export const createCustomer = async (req, res, next) => {
  try {
    const validatedData = await customerSchema.validate(req.body);
    const businessId = req.user.id;
    const result = await customerService.createCustomer(businessId, validatedData);
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
 * GET /api/customers
 * List all customers for a business
 */
export const listCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const businessId = req.user.id;

    const result = await customerService.listCustomers(businessId, {
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
 * GET /api/customers/:id
 * Get customer by ID
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerById(req.params.id);
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
 * PUT /api/customers/:id
 * Update customer (Business or Customer itself)
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userType = req.user.userType;

    // Check authorization: business can update their customers, customer can update themselves
    if (userType !== "business" && userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden - cannot update other customer accounts",
      });
    }

    const result = await customerService.updateCustomer(id, req.body);
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
 * DELETE /api/customers/:id
 * Delete/Deactivate customer (Business only)
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id);
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
 * GET /api/me/customer
 * Get current customer profile (Customer only)
 */
export const getMyCustomer = async (req, res, next) => {
  try {
    const result = await customerService.getCustomerById(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/me/customer
 * Update own customer profile (Customer only)
 */
export const updateMyCustomer = async (req, res, next) => {
  try {
    const result = await customerService.updateCustomer(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

import * as loyaltyService from "../services/loyaltyrequest.services.js";
import * as bcService from "../services/businesscustomer.services.js";
import { validateLoyaltyRequestInput } from "../validations/loyaltyrequest.validations.js";

export const createQuickLoyaltyRequestViaQR = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { businessId } = req.params;

    const result = await bcService.createQuickLoyaltyRequestViaQR(
      customerId,
      businessId,
    );

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
 * PATCH /api/loyalty-requests/:id/add-products
 * Merchant adds products to a pending loyalty request
 */
export const addProductsToLoyaltyRequest = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Products array is required and must contain at least one product",
      });
    }

    // Validate each product
    for (const product of products) {
      if (
        !product.productId ||
        product.stamps === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each product must have: productId and stamps",
        });
      }
    }

    const result = await loyaltyService.addProductsToLoyaltyRequest(
      businessId,
      id,
      products,
    );
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
 * POST /api/loyalty-requests
 * Create a loyalty request (Business submits purchase)
 * DEPRECATED: Use QR scan flow instead
 */
export const createLoyaltyRequest = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { businessCustomerId } = req.params;
    const { error, value } = validateLoyaltyRequestInput(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const result = await loyaltyService.createLoyaltyRequest(
      businessId,
      businessCustomerId,
      value,
    );
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
 * GET /api/loyalty-requests/:id
 * Get loyalty request by ID
 */
export const getLoyaltyRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await loyaltyService.getLoyaltyRequest(id);
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
 * GET /api/loyalty-requests/customer/:businessCustomerId
 * Get all loyalty requests for a business customer (Customer view)
 */
export const getCustomerLoyaltyRequests = async (req, res, next) => {
  try {
    const { businessCustomerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await loyaltyService.getCustomerLoyaltyRequests(
      businessCustomerId,
      status,
      parseInt(page),
      parseInt(limit),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/loyalty-requests/business/all
 * Get all loyalty requests for authenticated business (Business view)
 */
export const getBusinessLoyaltyRequests = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await loyaltyService.getBusinessLoyaltyRequests(
      businessId,
      status,
      parseInt(page),
      parseInt(limit),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/loyalty-requests
 * Merchant manually creates a pending loyalty request for a customer
 */
export const createManualLoyaltyRequest = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { businessCustomerId } = req.body;

    if (!businessCustomerId) {
      return res.status(400).json({
        success: false,
        message: "businessCustomerId is required",
      });
    }

    const result = await loyaltyService.createManualLoyaltyRequest(
      businessId,
      businessCustomerId,
    );
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
 * PATCH /api/loyalty-requests/:id/complete
 * Complete a loyalty request - Handles both STAMP and POINT based loyalty
 *
 * For STAMP-BASED:
 * Body: { type: "stamp", products: [ { productId, quantity }, ... ], amountSpent?: number }
 *
 * For POINT-BASED:
 * Body: { type: "point", amountSpent: number }
 */
export const completeLoyaltyRequest = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;
    const { type, amountSpent, products } = req.body;

    // Validate input
    if (!type || !["stamp", "point"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be "stamp" or "point"',
      });
    }

    if (type === "stamp") {
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "For stamp-based: products array is required with at least one item",
        });
      }
      for (const product of products) {
        if (!product.productId || product.stamps === undefined) {
          return res.status(400).json({
            success: false,
            message: "Each product must have productId and stamps",
          });
        }
      }
    }

    if (type === "point") {
      if (amountSpent === undefined || typeof amountSpent !== "number") {
        return res.status(400).json({
          success: false,
          message:
            "For point-based: amountSpent is required and must be a number",
        });
      }
    }

    const result = await loyaltyService.completeLoyaltyRequest(
      businessId,
      id,
      req.body,
    );
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
 * PATCH /api/loyalty-requests/:id/reject
 * Reject a loyalty request (Business rejects purchase)
 */
export const rejectLoyaltyRequest = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    const result = await loyaltyService.rejectLoyaltyRequest(
      businessId,
      id,
      reason,
    );
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
 * GET /api/loyalty-requests/stats/:businessCustomerId
 * Get loyalty statistics for a business customer
 */
export const getLoyaltyStats = async (req, res, next) => {
  try {
    const { businessCustomerId } = req.params;

    const result = await loyaltyService.getLoyaltyStats(businessCustomerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

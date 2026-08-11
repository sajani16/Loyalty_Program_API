import * as bcService from "../services/businesscustomer.services.js";

/**
 * POST /api/memberships/join/:businessId
 * Customer joins a business
 */
export const joinBusiness = async (req, res, next) => {
  try {
    // Extract customerId from authenticated user (NOT from request body)
    const customerId = req.user.id;
    const { businessId } = req.params;

    const result = await bcService.joinBusiness(customerId, businessId);
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
 * GET /api/memberships/cards
 * Get all business cards for authenticated customer
 */
export const getCustomerBusinessCards = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;

    const result = await bcService.getCustomerBusinessCards(customerId, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/memberships
 * Get all memberships for authenticated customer
 */
export const getCustomerMemberships = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { status } = req.query;

    const result = await bcService.getCustomerMemberships(customerId, status);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/memberships/:id
 * Get specific membership for authenticated customer
 */
export const getCustomerMembership = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { id: membershipId } = req.params;

    const result = await bcService.getCustomerMembership(customerId, membershipId);
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
 * GET /api/business/customers
 * Get all customers for authenticated business
 */
export const getBusinessCustomers = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await bcService.getBusinessCustomers(
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
 * GET /api/business/customers/:id
 * Get specific customer membership for authenticated business
 */
export const getBusinessCustomerMembership = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id: membershipId } = req.params;

    const result = await bcService.getBusinessCustomerMembership(
      businessId,
      membershipId,
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
 * PATCH /api/business/customers/:id/approve
 * Approve customer membership
 */
export const approveMembership = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id: membershipId } = req.params;

    const result = await bcService.approveMembership(businessId, membershipId);
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
 * PATCH /api/business/customers/:id/reject
 * Reject customer membership
 */
export const rejectMembership = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { id: membershipId } = req.params;

    const result = await bcService.rejectMembership(businessId, membershipId);
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
 * GET /api/memberships/:id/dashboard
 * Get customer dashboard for a specific membership
 */
export const getCustomerDashboard = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { id: businessCustomerId } = req.params;

    const result = await bcService.getCustomerDashboard(customerId, businessCustomerId);
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

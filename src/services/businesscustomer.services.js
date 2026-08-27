import * as bcRepo from "../repository/businesscustomer.repository.js";
import * as businessRepo from "../repository/business.repository.js";
import * as customerRepo from "../repository/customer.repository.js";
import * as loyaltyReqRepo from "../repository/loyaltyrequest.repository.js";
import { logger } from "../utils/logger.js";
import { emitNewLoyaltyRequest } from "../websocket/loyaltySocket.js";

/**
 * Customer joins a business
 * Creates a pending membership
 */
export const joinBusiness = async (customerId, businessId) => {
  // Verify business exists
  const business = await businessRepo.findBusinessById(businessId);
  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("businesscustomer", "Join failed - business not found", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Verify customer exists
  const customer = await customerRepo.findCustomerById(customerId);
  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    logger("businesscustomer", "Join failed - customer not found", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Check if membership already exists
  const existingMembership = await bcRepo.findByBusinessAndCustomer(
    businessId,
    customerId,
  );
  if (existingMembership) {
    const error = new Error("Membership already exists for this customer and business");
    error.status = 409;
    logger("businesscustomer", "Join failed - duplicate membership", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Create membership
  const membership = await bcRepo.createBusinessCustomer({
    businessId,
    customerId,
    status: "pending", // Default status
    points: 0,
    tier: "basic",
    stampCards: [],
    joinedAt: new Date(),
  });

  logger("businesscustomer", "Customer joined business", {
    customerId,
    businessId,
    membershipId: membership._id,
  });

  return {
    success: true,
    data: membership,
    message: "Membership request submitted. Awaiting business approval.",
  };
};

/**
 * QR SCAN: Create quick loyalty request with WebSocket notification
 * Triggered when: Customer scans merchant QR code
 * Result: Pending request created, merchant notified in real-time
 */
export const createQuickLoyaltyRequestViaQR = async (customerId, businessId) => {
  // Verify business exists
  const business = await businessRepo.findBusinessById(businessId);
  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("businesscustomer", "QR scan failed - business not found", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Verify customer exists
  const customer = await customerRepo.findCustomerById(customerId);
  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    logger("businesscustomer", "QR scan failed - customer not found", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Check or create BusinessCustomer relationship
  let businessCustomer = await bcRepo.findByBusinessAndCustomer(businessId, customerId);

  if (!businessCustomer) {
    // Auto-create pending membership
    businessCustomer = await bcRepo.createBusinessCustomer({
      businessId,
      customerId,
      status: "pending",
      points: 0,
      tier: "basic",
      stampCards: [],
      joinedAt: new Date(),
    });

    logger("businesscustomer", "Auto-created membership from QR scan", {
      customerId,
      businessId,
      membershipId: businessCustomer._id,
    });
  }

  // Check if customer is blocked or rejected
  if (businessCustomer.status === "rejected" || businessCustomer.status === "blocked") {
    const error = new Error(`Cannot create request: membership is ${businessCustomer.status}`);
    error.status = 403;
    logger("businesscustomer", "QR scan rejected - invalid membership status", {
      customerId,
      businessId,
      status: businessCustomer.status,
    });
    throw error;
  }

  // Create pending loyalty request (no products yet)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const loyaltyRequest = await loyaltyReqRepo.createLoyaltyRequest({
    businessCustomerId: businessCustomer._id,
    products: [],
    amountSpent: null,
    pointsAwarded: null,
    stampsAwarded: null,
    status: "pending",
    expiresAt,
  });

  logger("businesscustomer", "Loyalty request created via QR scan", {
    customerId,
    businessId,
    requestId: loyaltyRequest._id,
  });

  // ========== WEBSOCKET EMISSION ==========
  // Notify all connected merchants of this business in real-time
  if (global.io) {
    emitNewLoyaltyRequest(global.io, businessId, {
      requestId: loyaltyRequest._id.toString(),
      businessCustomerId: businessCustomer._id.toString(),
      customerId: customer._id.toString(),
      customerEmail: customer.email,
      customerName: customer.name,
      currentPoints: businessCustomer.points,
      currentTier: businessCustomer.tier,
      stampCards: businessCustomer.stampCards,
      expiresAt: expiresAt.toISOString(),
    });

    logger("websocket", "QR request notification sent to merchants", {
      businessId,
      requestId: loyaltyRequest._id,
    });
  }

  return {
    success: true,
    data: {
      requestId: loyaltyRequest._id.toString(),
      businessCustomerId: businessCustomer._id.toString(),
      customerId,
      businessId,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
      message: "Loyalty request sent to merchant",
    },
    message: "QR scan successful. Request sent to merchant dashboard.",
  };
};

/**
 * Get all business cards for a customer (their associated businesses)
 */
export const getCustomerBusinessCards = async (customerId, status) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const memberships = await bcRepo.findCustomerMemberships(customerId, filter);

  // Extract business information from memberships
  const businessCards = memberships.map((membership) => ({
    membershipId: membership._id,
    businessId: membership.businessId._id,
    businessName: membership.businessId.name,
    businessEmail: membership.businessId.email,
    businessPhone: membership.businessId.phone,
    status: membership.status,
    points: membership.points,
    stamps: membership.stamps,
    tier: membership.tier,
    joinedAt: membership.joinedAt,
    createdAt: membership.createdAt,
  }));

  logger("businesscustomer", "Customer business cards retrieved", {
    customerId,
    count: businessCards.length,
  });

  return {
    success: true,
    data: businessCards,
    message: "Business cards fetched successfully",
  };
};

/**
 * Get all memberships for a customer
 */
export const getCustomerMemberships = async (customerId, status) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const memberships = await bcRepo.findCustomerMemberships(customerId, filter);

  logger("businesscustomer", "Customer memberships retrieved", {
    customerId,
    count: memberships.length,
  });

  return {
    success: true,
    data: memberships,
    message: "Memberships fetched successfully",
  };
};

/**
 * Get a specific membership for a customer
 */
export const getCustomerMembership = async (customerId, membershipId) => {
  const membership = await bcRepo.findById(membershipId);

  if (!membership) {
    const error = new Error("Membership not found");
    error.status = 404;
    logger("businesscustomer", "Membership not found", {
      customerId,
      membershipId,
    });
    throw error;
  }

  // Verify ownership
  if (membership.customerId._id.toString() !== customerId) {
    const error = new Error("Forbidden - not your membership");
    error.status = 403;
    logger("businesscustomer", "Unauthorized membership access", {
      customerId,
      membershipId,
      actualCustomerId: membership.customerId._id,
    });
    throw error;
  }

  return {
    success: true,
    data: membership,
    message: "Membership fetched successfully",
  };
};

/**
 * Get all customers for a business
 */
export const getBusinessCustomers = async (businessId, status, page, limit) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { createdAt: -1 },
    populate: { 
      path: "customerId", 
      select: "name email phone status",
    },
  };

  const result = await bcRepo.findBusinessCustomersPaginated(
    businessId,
    filter,
    options,
  );

  logger("businesscustomer", "Business customers retrieved", {
    businessId,
    count: result.docs.length,
  });

  return {
    success: true,
    data: result.docs,
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.totalDocs,
      pages: result.totalPages,
    },
    message: "Customers fetched successfully",
  };
};

/**
 * Get a specific customer membership for a business with stamp card data
 */
export const getBusinessCustomerMembership = async (businessId, membershipId) => {
  // Fetch membership with populated stamp card product details
  const membership = await bcRepo.findById(membershipId);

  if (!membership) {
    const error = new Error("Membership not found");
    error.status = 404;
    logger("businesscustomer", "Membership not found", {
      businessId,
      membershipId,
    });
    throw error;
  }

  // Verify ownership
  if (membership.businessId._id.toString() !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("businesscustomer", "Unauthorized membership access", {
      businessId,
      membershipId,
      actualBusinessId: membership.businessId._id,
    });
    throw error;
  }

  return {
    success: true,
    data: membership,
    message: "Membership fetched successfully",
  };
};

/**
 * Approve customer membership (Business only)
 */
export const approveMembership = async (businessId, membershipId) => {
  const membership = await bcRepo.findById(membershipId);

  if (!membership) {
    const error = new Error("Membership not found");
    error.status = 404;
    throw error;
  }

  // Verify ownership
  if (membership.businessId._id.toString() !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("businesscustomer", "Unauthorized approval attempt", {
      businessId,
      membershipId,
    });
    throw error;
  }

  const updated = await bcRepo.updateBusinessCustomer(membershipId, {
    status: "active",
    joinedAt: new Date(),
  });

  logger("businesscustomer", "Membership approved", {
    businessId,
    membershipId,
    customerId: membership.customerId._id,
  });

  return {
    success: true,
    data: updated,
    message: "Membership approved successfully",
  };
};

/**
 * Reject customer membership (Business only)
 */
export const rejectMembership = async (businessId, membershipId) => {
  const membership = await bcRepo.findById(membershipId);

  if (!membership) {
    const error = new Error("Membership not found");
    error.status = 404;
    throw error;
  }

  // Verify ownership
  if (membership.businessId._id.toString() !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("businesscustomer", "Unauthorized rejection attempt", {
      businessId,
      membershipId,
    });
    throw error;
  }

  const updated = await bcRepo.updateBusinessCustomer(membershipId, {
    status: "rejected",
  });

  logger("businesscustomer", "Membership rejected", {
    businessId,
    membershipId,
    customerId: membership.customerId._id,
  });

  return {
    success: true,
    data: updated,
    message: "Membership rejected successfully",
  };
};

/**
 * Get customer dashboard (all loyalty stats for a customer with a specific business)
 */
export const getCustomerDashboard = async (customerId, businessCustomerId) => {
  const membership = await bcRepo.findById(businessCustomerId);

  if (!membership) {
    const error = new Error("Membership not found");
    error.status = 404;
    logger("businesscustomer", "Dashboard fetch failed - membership not found", {
      customerId,
      businessCustomerId,
    });
    throw error;
  }

  // Verify ownership
  if (membership.customerId._id.toString() !== customerId) {
    const error = new Error("Forbidden - not your membership");
    error.status = 403;
    logger("businesscustomer", "Unauthorized dashboard access", {
      customerId,
      businessCustomerId,
    });
    throw error;
  }

  // Get all loyalty requests for this membership
  const { loyaltyReqRepo } = await import("../repository/loyaltyrequest.repository.js");
  const loyaltyStats = await loyaltyReqRepo.getLoyaltyRequestStats(businessCustomerId);

  logger("businesscustomer", "Customer dashboard retrieved", {
    customerId,
    businessCustomerId,
  });

  return {
    success: true,
    data: {
      membership: {
        businessId: membership.businessId._id,
        businessName: membership.businessId.name,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
      loyalty: {
        points: membership.points,
        tier: membership.tier,
        stampCards: membership.stampCards,
      },
      stats: loyaltyStats,
    },
    message: "Dashboard fetched successfully",
  };
};

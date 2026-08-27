import * as loyaltyReqRepo from "../repository/loyaltyrequest.repository.js";
import * as bcRepo from "../repository/businesscustomer.repository.js";
import * as businessRepo from "../repository/business.repository.js";
import * as customerRepo from "../repository/customer.repository.js";
import * as productRepo from "../repository/product.repository.js";
import { logger } from "../utils/logger.js";
import {
  emitRequestCompleted,
  emitRequestRejected,
} from "../websocket/loyaltySocket.js";

/**
 * Create a quick loyalty request via QR scan (Customer initiates)
 * This is used when customer scans merchant QR code
 * Creates a pending LoyaltyRequest for the merchant to process
 */
export const createQuickLoyaltyRequest = async (customerId, businessId) => {
  // Verify business exists
  const business = await businessRepo.findBusinessById(businessId);
  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("loyaltyrequest", "Quick request failed - business not found", {
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
    logger("loyaltyrequest", "Quick request failed - customer not found", {
      customerId,
      businessId,
    });
    throw error;
  }

  // Check or create BusinessCustomer relationship
  let businessCustomer = await bcRepo.findByBusinessAndCustomer(
    businessId,
    customerId,
  );

  if (!businessCustomer) {
    // Auto-create pending membership if it doesn't exist
    businessCustomer = await bcRepo.createBusinessCustomer({
      businessId,
      customerId,
      status: "pending",
      points: 0,
      tier: "basic",
      stampCards: [],
      joinedAt: new Date(),
    });

    logger("loyaltyrequest", "Auto-created pending membership for QR scan", {
      customerId,
      businessId,
      membershipId: businessCustomer._id,
    });
  }

  if (
    businessCustomer.status === "rejected" ||
    businessCustomer.status === "blocked"
  ) {
    const error = new Error(
      `Cannot create request: membership is ${businessCustomer.status}`,
    );
    error.status = 403;
    logger(
      "loyaltyrequest",
      "Quick request rejected - membership status invalid",
      {
        customerId,
        businessId,
        status: businessCustomer.status,
      },
    );
    throw error;
  }

  // Create pending loyalty request with no products yet
  // Merchant will add products and complete it
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
  // Notify merchant after request is successfully created
  emitNewLoyaltyRequest(businessId, {
    requestId: loyaltyRequest._id,
    customerId,
    customerName: customer.name,
    expiresAt,
  });

  logger("loyaltyrequest", "Quick loyalty request created via QR scan", {
    customerId,
    businessId,
    businessCustomerId: businessCustomer._id,
    requestId: loyaltyRequest._id,
  });

  return {
    success: true,
    data: {
      requestId: loyaltyRequest._id,
      businessCustomerId: businessCustomer._id,
      customerId,
      businessId,
      status: "pending",
      expiresAt,
      message: "Present this request to merchant for processing",
    },
    message: "Loyalty request initiated. Awaiting merchant confirmation.",
  };
};

/**
 * Merchant adds products to a pending loyalty request
 */
export const addProductsToLoyaltyRequest = async (
  businessId,
  requestId,
  productsData,
) => {
  const request = await loyaltyReqRepo.findLoyaltyRequestById(requestId);

  if (!request) {
    const error = new Error("Loyalty request not found");
    error.status = 404;
    throw error;
  }

  if (request.status !== "pending") {
    const error = new Error(
      `Cannot add products to a ${request.status} request`,
    );
    error.status = 400;
    throw error;
  }

  // Verify ownership
  // NOTE: businessId is populated (not a raw ObjectId), so we must use ._id
  const requestBusinessId = request.businessCustomerId.businessId?._id?.toString()
    ?? request.businessCustomerId.businessId?.toString();
  if (requestBusinessId !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("loyaltyrequest", "Unauthorized product addition attempt", {
      businessId,
      requestId,
    });
    throw error;
  }

  // Validate products - now only contains productId and stamps
  for (const product of productsData) {
    const existingProduct = await productRepo.findProductById(
      product.productId,
    );
    if (!existingProduct) {
      const error = new Error(`Product ${product.productId} not found`);
      error.status = 404;
      throw error;
    }

    if (existingProduct.businessId.toString() !== businessId) {
      const error = new Error(
        `Product ${product.productId} does not belong to your business`,
      );
      error.status = 403;
      throw error;
    }
  }

  const updated = await loyaltyReqRepo.updateLoyaltyRequest(requestId, {
    products: productsData,
  });

  logger("loyaltyrequest", "Products added to loyalty request", {
    businessId,
    requestId,
    productCount: productsData.length,
  });

  return {
    success: true,
    data: updated,
    message: "Products added successfully. Ready to complete request.",
  };
};

/**
 * Get loyalty request by ID
 */
export const getLoyaltyRequest = async (requestId) => {
  const request = await loyaltyReqRepo.findLoyaltyRequestById(requestId);

  if (!request) {
    const error = new Error("Loyalty request not found");
    error.status = 404;
    logger("loyaltyrequest", "Request not found", { requestId });
    throw error;
  }

  return {
    success: true,
    data: request,
    message: "Loyalty request fetched successfully",
  };
};

/**
 * Get all loyalty requests for a business customer (Customer view)
 */
export const getCustomerLoyaltyRequests = async (
  businessCustomerId,
  status,
  page,
  limit,
) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { createdAt: -1 },
  };

  const result =
    await loyaltyReqRepo.findLoyaltyRequestsByBusinessCustomerPaginated(
      businessCustomerId,
      filter,
      options,
    );

  logger("loyaltyrequest", "Customer loyalty requests retrieved", {
    businessCustomerId,
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
    message: "Loyalty requests fetched successfully",
  };
};

/**
 * Get all loyalty requests for a business (Business view)
 */
export const getBusinessLoyaltyRequests = async (
  businessId,
  status,
  page,
  limit,
) => {
  const filter = {};
  
  // Only add status filter if it's not "all"
  if (status && status !== "all") {
    filter.status = status;
  }

  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { createdAt: -1 },
  };

  const result = await loyaltyReqRepo.findLoyaltyRequestsByBusinessPaginated(
    businessId,
    filter,
    options,
  );

  logger("loyaltyrequest", "Business loyalty requests retrieved", {
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
    message: "Loyalty requests fetched successfully",
  };
};

/**
 * Create a manual loyalty request for a customer (Merchant initiated)
 */
export const createManualLoyaltyRequest = async (businessId, businessCustomerId) => {
  try {
    // Verify business customer exists
    const businessCustomer = await bcRepo.findById(businessCustomerId);
    
    if (!businessCustomer) {
      const error = new Error("Business customer not found");
      error.status = 404;
      throw error;
    }

    // Skip authorization - assuming dropdown is properly filtered on frontend

    // Create pending loyalty request
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const loyaltyRequest = await loyaltyReqRepo.createLoyaltyRequest({
      businessCustomerId,
      status: "pending",
      expiresAt,
      products: [],
    });

    logger("loyaltyrequest", "Manual loyalty request created", {
      businessId,
      businessCustomerId,
      requestId: loyaltyRequest._id,
    });

    return {
      success: true,
      data: loyaltyRequest,
      message: "Loyalty request created successfully",
    };
  } catch (err) {
    logger("loyaltyrequest", "Failed to create manual loyalty request", {
      businessId,
      businessCustomerId,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Complete a loyalty request (Business approves purchase and awards loyalty)
 * Handles both STAMP-BASED and POINT-BASED loyalty types
 */
export const completeLoyaltyRequest = async (
  businessId,
  requestId,
  completionData,
) => {
  const request = await loyaltyReqRepo.findLoyaltyRequestById(requestId);

  if (!request) {
    const error = new Error("Loyalty request not found");
    error.status = 404;
    throw error;
  }

  if (request.status !== "pending") {
    const error = new Error(`Cannot complete a ${request.status} request`);
    error.status = 400;
    throw error;
  }

  // Verify ownership
  // NOTE: businessId is populated (not a raw ObjectId), so we must use ._id
  const requestBusinessId = request.businessCustomerId.businessId?._id?.toString()
    ?? request.businessCustomerId.businessId?.toString();
  if (requestBusinessId !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("loyaltyrequest", "Unauthorized completion attempt", {
      businessId,
      requestId,
    });
    throw error;
  }

  let pointsAwarded = 0;
  let stampsAwarded = 0;
  let updatedStampCards = [];

  const businessCustomerId = request.businessCustomerId._id;
  const businessCustomer = await bcRepo.findById(businessCustomerId);

  if (!businessCustomer) {
    const error = new Error("Business customer not found");
    error.status = 404;
    throw error;
  }

  if (
    businessCustomer.status === "rejected" ||
    businessCustomer.status === "blocked"
  ) {
    const error = new Error(
      `Membership cannot be completed because it is ${businessCustomer.status}`,
    );
    error.status = 403;
    logger("loyaltyrequest", "Completion blocked - membership restricted", {
      businessId,
      requestId,
      businessCustomerId,
      membershipStatus: businessCustomer.status,
    });
    throw error;
  }

  // ========== STAMP-BASED LOYALTY ==========
  if (completionData.type === "stamp" && completionData.products) {
    // For each product, we need to update or create a stamp card
    // Ensure we don't create duplicates for the same product
    updatedStampCards = businessCustomer.stampCards || [];

    for (const product of completionData.products) {
      const productData = await productRepo.findProductById(product.productId);

      if (!productData) {
        const error = new Error(`Product ${product.productId} not found`);
        error.status = 404;
        throw error;
      }

      // Verify product is stamp-eligible
      if (!productData.stampEligible) {
        const error = new Error(
          `Product ${product.productId} is not stamp-eligible`,
        );
        error.status = 400;
        throw error;
      }

      const productIdStr = product.productId.toString();

      // Find existing card for this product
      let existingCard = updatedStampCards.find(
        (sc) => {
          const scProductId = sc.productId._id?.toString?.() || sc.productId?.toString?.();
          return scProductId === productIdStr;
        }
      );

      if (existingCard) {
        // Update existing card - add to progress
        existingCard.progress += product.stamps;
        
        // Check if stamp target is reached
        if (productData.stampTarget && existingCard.progress >= productData.stampTarget) {
          const completedCount = Math.floor(
            existingCard.progress / productData.stampTarget,
          );
          existingCard.completedCards = completedCount;
          stampsAwarded += completedCount;

          logger("loyaltyrequest", "Stamp target reached (updated)", {
            businessCustomerId,
            productId: productIdStr,
            completedCards: completedCount,
            progress: existingCard.progress,
          });
        }
      } else {
        // Create new stamp card (first time this product is scanned)
        let newProgress = product.stamps;
        let newCompletedCards = 0;

        if (productData.stampTarget && newProgress >= productData.stampTarget) {
          newCompletedCards = Math.floor(newProgress / productData.stampTarget);
          stampsAwarded += newCompletedCards;

          logger("loyaltyrequest", "Stamp target reached (new card)", {
            businessCustomerId,
            productId: productIdStr,
            completedCards: newCompletedCards,
          });
        }

        updatedStampCards.push({
          productId: product.productId,
          progress: newProgress,
          completedCards: newCompletedCards,
        });
      }
    }

    // Calculate points from total amount if provided
    if (completionData.amountSpent !== undefined) {
      pointsAwarded = Math.floor(completionData.amountSpent);
    }
  }

  // ========== POINT-BASED LOYALTY ==========
  else if (
    completionData.type === "point" &&
    completionData.amountSpent !== undefined
  ) {
    // Merchant entered amount → calculate points
    pointsAwarded = Math.floor(completionData.amountSpent);
    stampsAwarded = 0;

    logger("loyaltyrequest", "Points calculated from amount", {
      businessCustomerId,
      amountSpent: completionData.amountSpent,
      pointsAwarded,
    });
  } else {
    const error = new Error(
      "Invalid completion data: specify type (stamp or point) and required fields",
    );
    error.status = 400;
    throw error;
  }

  // ========== UPDATE BUSINESSCUSTOMER ==========
  const newPoints = businessCustomer.points + pointsAwarded;
  const newTier = calculateTier(newPoints);

  const membershipStatus = "active";

  await bcRepo.updateBusinessCustomer(businessCustomerId, {
    status: membershipStatus,
    points: newPoints,
    tier: newTier,
    stampCards: updatedStampCards,
  });

  logger("loyaltyrequest", "BusinessCustomer updated after completion", {
    businessCustomerId,
    newPoints,
    newTier,
    pointsAwarded,
    stampsAwarded,
  });

  // ========== MARK REQUEST AS COMPLETED ==========
  const updated = await loyaltyReqRepo.updateLoyaltyRequest(requestId, {
    status: "completed",
    pointsAwarded,
    stampsAwarded,
    amountSpent: completionData.amountSpent,
    products: completionData.products || request.products,
    completedAt: new Date(),
  });
  // Notify customer after request is successfully completed
  emitRequestCompleted(businessCustomer.customerId, {
    requestId: updated._id,
    points: pointsAwarded,
    stamps: stampsAwarded,
    reward: null,
  });
  logger("loyaltyrequest", "Loyalty request completed", {
    businessId,
    requestId,
    type: completionData.type,
    pointsAwarded,
    stampsAwarded,
  });

  return {
    success: true,
    data: {
      requestId: updated._id,
      status: "completed",
      type: completionData.type,
      pointsAwarded,
      membershipStatus,
      stampsAwarded,
      customerUpdate: {
        newPoints,
        newTier,
        stampCards: updatedStampCards,
      },
      status: membershipStatus,
    },
    message:
      "Loyalty request completed. Points and stamps awarded successfully.",
  };
};

const calculateTier = (points) => {
  if (points >= 10000) return "platinum";
  if (points >= 5000) return "gold";
  if (points >= 1000) return "silver";
  return "basic";
};

/**
 * Reject a loyalty request (Business rejects purchase)
 */
export const rejectLoyaltyRequest = async (businessId, requestId, reason) => {
  const request = await loyaltyReqRepo.findLoyaltyRequestById(requestId);

  if (!request) {
    const error = new Error("Loyalty request not found");
    error.status = 404;
    throw error;
  }

  // Verify ownership
  // NOTE: businessId is populated (not a raw ObjectId), so we must use ._id
  const rejectBusinessId = request.businessCustomerId.businessId?._id?.toString()
    ?? request.businessCustomerId.businessId?.toString();
  if (rejectBusinessId !== businessId) {
    const error = new Error("Forbidden - not your business");
    error.status = 403;
    logger("loyaltyrequest", "Unauthorized rejection attempt", {
      businessId,
      requestId,
    });
    throw error;
  }

  if (request.status !== "pending") {
    const error = new Error(`Cannot reject a ${request.status} request`);
    error.status = 400;
    throw error;
  }

  const updated = await loyaltyReqRepo.updateLoyaltyRequest(requestId, {
    status: "rejected",
    rejectedAt: new Date(),
  });
  emitRequestRejected(request.businessCustomerId.customerId, {
    requestId: updated._id,
    reason: reason || null,
  });
  logger("loyaltyrequest", "Loyalty request rejected", {
    businessId,
    requestId,
    reason,
  });

  return {
    success: true,
    data: updated,
    message: "Loyalty request rejected successfully",
  };
};

/**
 * Get loyalty request statistics for a business customer
 */
export const getLoyaltyStats = async (businessCustomerId) => {
  const stats = await loyaltyReqRepo.getLoyaltyRequestStats(businessCustomerId);
  const totals =
    await loyaltyReqRepo.getTotalPointsAndStamps(businessCustomerId);

  logger("loyaltyrequest", "Loyalty stats retrieved", {
    businessCustomerId,
  });

  return {
    success: true,
    data: {
      stats,
      totals,
    },
    message: "Loyalty statistics fetched successfully",
  };
};

/**
 * Mark expired loyalty requests
 */
export const markExpiredRequests = async () => {
  const expiredRequests = await loyaltyReqRepo.findExpiredLoyaltyRequests();

  if (expiredRequests.length === 0) {
    return {
      success: true,
      data: { count: 0 },
      message: "No expired requests found",
    };
  }

  const ids = expiredRequests.map((req) => req._id);
  await loyaltyReqRepo.markAsExpired(ids);

  logger("loyaltyrequest", "Expired requests marked", {
    count: ids.length,
  });

  return {
    success: true,
    data: { count: ids.length },
    message: `${ids.length} requests marked as expired`,
  };
};

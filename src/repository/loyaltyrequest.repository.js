import LoyaltyRequest from "../models/LoyaltyRequest.js";
import BusinessCustomer from "../models/BusinessCustomer.js";

/**
 * Create a new loyalty request
 */
export async function createLoyaltyRequest(loyaltyRequestObj) {
  const request = new LoyaltyRequest(loyaltyRequestObj);
  return request.save();
}

/**
 * Find loyalty request by ID
 */
export async function findLoyaltyRequestById(id) {
  return LoyaltyRequest.findById(id)
    .select("_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt completedAt")
    .populate({
      path: "businessCustomerId",
      select: "businessId tier customerId",
      populate: {
        path: "businessId",
        select: "name",
      },
    })
    .lean();
}

/**
 * Get all loyalty requests for a business customer
 */
export async function findLoyaltyRequestsByBusinessCustomer(
  businessCustomerId,
  filter = {},
) {
  return LoyaltyRequest.find({
    businessCustomerId,
    ...filter,
  })
    .select("_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get paginated loyalty requests for a business customer
 */
export async function findLoyaltyRequestsByBusinessCustomerPaginated(
  businessCustomerId,
  filter,
  options,
) {
  const data = await LoyaltyRequest.paginate(
    {
      businessCustomerId,
      ...filter,
    },
    {
      ...options,
      select: "_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt",
    },
  );
  return data;
}

/**
 * Get pending loyalty requests for a business customer
 */
export async function findPendingLoyaltyRequests(businessCustomerId) {
  return LoyaltyRequest.find({
    businessCustomerId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .select("_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get loyalty requests by business (through businessCustomer)
 */
export async function findLoyaltyRequestsByBusiness(businessId, filter = {}) {
  const businessCustomerIds = await BusinessCustomer.find({
    businessId,
  }).select("_id");

  return LoyaltyRequest.find({
    businessCustomerId: { $in: businessCustomerIds.map((bc) => bc._id) },
    ...filter,
  })
    .select("_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt")
    .populate({
      path: "businessCustomerId",
      select: "customerId",
    })
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get paginated loyalty requests by business
 */
export async function findLoyaltyRequestsByBusinessPaginated(
  businessId,
  filter,
  options,
) {
  const businessCustomerIds = await BusinessCustomer.find({
    businessId,
  }).select("_id");

  const data = await LoyaltyRequest.paginate(
    {
      businessCustomerId: { $in: businessCustomerIds.map((bc) => bc._id) },
      ...filter,
    },
    {
      ...options,
      select: "_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt",
      populate: {
        path: "businessCustomerId",
        select: "customerId tier",
        populate: {
          path: "customerId",
          select: "name email",
        },
      },
    },
  );
  return data;
}

/**
 * Update loyalty request status
 */
export async function updateLoyaltyRequest(id, updateData) {
  return LoyaltyRequest.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .select("_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt completedAt")
    .populate({
      path: "businessCustomerId",
      select: "businessId tier",
    })
    .lean();
}

/**
 * Check if loyalty request exists
 */
export async function loyaltyRequestExists(id) {
  const count = await LoyaltyRequest.countDocuments({ _id: id });
  return count > 0;
}

/**
 * Get expired loyalty requests
 */
export async function findExpiredLoyaltyRequests() {
  return LoyaltyRequest.find({
    status: "pending",
    expiresAt: { $lt: new Date() },
  })
    .select("_id businessCustomerId status expiresAt")
    .lean();
}

/**
 * Mark loyalty requests as expired
 */
export async function markAsExpired(ids) {
  return LoyaltyRequest.updateMany(
    { _id: { $in: ids } },
    { status: "expired" },
    { new: true },
  );
}

/**
 * Get loyalty request statistics for a business customer
 */
export async function getLoyaltyRequestStats(businessCustomerId) {
  return LoyaltyRequest.aggregate([
    { $match: { businessCustomerId: businessCustomerId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amountSpent" },
        totalPoints: { $sum: "$pointsAwarded" },
        totalStamps: { $sum: "$stampsAwarded" },
      },
    },
  ]);
}

/**
 * Get total points and stamps for a business customer
 */
export async function getTotalPointsAndStamps(businessCustomerId) {
  const results = await LoyaltyRequest.aggregate([
    {
      $match: {
        businessCustomerId: businessCustomerId,
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: "$pointsAwarded" },
        totalStamps: { $sum: "$stampsAwarded" },
      },
    },
  ]);

  return results[0] || { totalPoints: 0, totalStamps: 0 };
}


/**
 * Get paginated loyalty requests for a customer (their activity history)
 * Optimized: Fetch all business-customer relationships first, then loyalty requests
 */
export async function findLoyaltyRequestsByCustomerPaginated(
  customerId,
  filter,
  options,
) {
  try {
    // Step 1: Get all business-customer relationships for this customer
    const businessCustomers = await BusinessCustomer.find({
      customerId,
    })
      .populate("businessId", "name")
      .select("_id tier")
      .lean();

    if (!businessCustomers || businessCustomers.length === 0) {
      // No memberships found, return empty results
      return {
        docs: [],
        page: options.page || 1,
        limit: options.limit || 10,
        total: 0,
        totalDocs: 0,
        pages: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const bcIds = businessCustomers.map((bc) => bc._id);

    // Step 2: Build query for loyalty requests
    const query = {
      businessCustomerId: { $in: bcIds },
      ...filter,
    };

    // Step 3: Get total count
    const total = await LoyaltyRequest.countDocuments(query);

    // Step 4: Fetch paginated loyalty requests
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const pages = Math.ceil(total / limit);

    const loyaltyRequests = await LoyaltyRequest.find(query)
      .select(
        "_id businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt",
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Step 5: Enrich loyalty requests with business customer details
    const bcMap = new Map(businessCustomers.map((bc) => [bc._id.toString(), bc]));

    const enrichedRequests = loyaltyRequests.map((req) => {
      const bc = bcMap.get(req.businessCustomerId.toString());
      return {
        _id: req._id,
        businessCustomerId: {
          _id: req.businessCustomerId,
          businessId: {
            name: bc?.businessId?.name || "Unknown Business",
          },
          tier: bc?.tier || "basic",
        },
        amountSpent: req.amountSpent,
        pointsAwarded: req.pointsAwarded,
        stampsAwarded: req.stampsAwarded,
        status: req.status,
        createdAt: req.createdAt,
      };
    });

    return {
      docs: enrichedRequests,
      page,
      limit,
      total,
      totalDocs: total,
      pages,
      totalPages: pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    };
  } catch (err) {
    console.error("Error in findLoyaltyRequestsByCustomerPaginated:", err);
    throw err;
  }
}

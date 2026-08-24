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
        select: "customerId",
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
 */
export async function findLoyaltyRequestsByCustomerPaginated(
  customerId,
  filter,
  options,
) {
  const businessCustomerIds = await BusinessCustomer.find({
    customerId,
  }).select("_id");

  const data = await LoyaltyRequest.paginate(
    {
      businessCustomerId: { $in: businessCustomerIds.map((bc) => bc._id) },
      ...filter,
    },
    {
      ...options,
      select: "businessCustomerId amountSpent pointsAwarded stampsAwarded status createdAt",
      populate: {
        path: "businessCustomerId",
        select: "businessId tier",
        populate: {
          path: "businessId",
          select: "name",
        },
      },
    },
  );

  return data;
}

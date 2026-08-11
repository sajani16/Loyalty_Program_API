import LoyaltyRequest from "../models/LoyaltyRequest.js";

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
    .populate("businessCustomerId")
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
    options,
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
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get loyalty requests by business (through businessCustomer)
 */
export async function findLoyaltyRequestsByBusiness(businessId, filter = {}) {
  return LoyaltyRequest.find()
    .populate({
      path: "businessCustomerId",
      match: { businessId },
      select: "customerId businessId",
    })
    .find({ businessCustomerId: { $ne: null } })
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
  const data = await LoyaltyRequest.paginate(
    {
      "businessCustomerId.businessId": businessId,
      ...filter,
    },
    {
      ...options,
      populate: {
        path: "businessCustomerId",
        select: "customerId businessId",
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
    .populate("businessCustomerId")
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
  }).lean();
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

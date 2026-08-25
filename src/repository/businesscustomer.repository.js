import BusinessCustomer from "../models/BusinessCustomer.js";

/**
 * Create a new BusinessCustomer relationship
 */
export async function createBusinessCustomer(businessCustomerObj) {
  const relationship = new BusinessCustomer(businessCustomerObj);
  return relationship.save();
}

/**
 * Find BusinessCustomer by businessId and customerId
 */
export async function findByBusinessAndCustomer(businessId, customerId) {
  return BusinessCustomer.findOne({
    businessId,
    customerId,
  })
    .select("_id businessId customerId status points tier")
    .populate("businessId", "name")
    .populate("customerId", "name email")
    .lean();
}

/**
 * Find BusinessCustomer by ID
 */
export async function findById(id) {
  return BusinessCustomer.findById(id)
    .select("_id businessId customerId status points tier joinedAt")
    .populate("businessId", "name")
    .populate("customerId", "name")
    .lean();
}

/**
 * Get all memberships for a customer
 */
export async function findCustomerMemberships(customerId, filter = {}) {
  return BusinessCustomer.find({
    customerId,
    ...filter,
  })
    .select("_id businessId customerId status points tier stampCards joinedAt")
    .populate("businessId", "name email phone")
    .populate(
      "stampCards.productId",
      "_id name price stampEligible stampTarget rewardQuantity isActive",
    )
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get all customers for a business
 */
export async function findBusinessCustomers(businessId, filter = {}) {
  return BusinessCustomer.find({
    businessId,
    ...filter,
  })
    .select("_id businessId customerId status points tier joinedAt")
    .populate("customerId", "name email")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get paginated customers for a business
 */
export async function findBusinessCustomersPaginated(
  businessId,
  filter,
  options,
) {
  const data = await BusinessCustomer.paginate(
    {
      businessId,
      ...filter,
    },
    {
      ...options,
      select: "_id businessId customerId status points tier joinedAt",
    },
  );
  return data;
}

/**
 * Update BusinessCustomer relationship
 */
export async function updateBusinessCustomer(id, updateData) {
  return BusinessCustomer.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .select("_id businessId customerId status points tier joinedAt")
    .populate("businessId", "name")
    .populate("customerId", "name email")
    .lean();
}

/**
 * Delete/Remove BusinessCustomer relationship
 */
export async function deleteBusinessCustomer(id) {
  return BusinessCustomer.findByIdAndDelete(id).lean();
}

/**
 * Check if membership exists
 */
export async function membershipExists(businessId, customerId) {
  const count = await BusinessCustomer.countDocuments({
    businessId,
    customerId,
  });
  return count > 0;
}

/**
 * Get membership count for a customer
 */
export async function getCustomerMembershipCount(customerId) {
  return BusinessCustomer.countDocuments({ customerId });
}

/**
 * Get customer count for a business
 */
export async function getBusinessCustomerCount(businessId) {
  return BusinessCustomer.countDocuments({ businessId });
}

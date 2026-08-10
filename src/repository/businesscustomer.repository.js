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
    .populate("businessId", "name email")
    .populate("customerId", "name email")
    .lean();
}

/**
 * Find BusinessCustomer by ID
 */
export async function findById(id) {
  return BusinessCustomer.findById(id)
    .populate("businessId", "name email")
    .populate("customerId", "name email")
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
    .populate("businessId", "name email phone status")
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
    .populate("customerId", "name email phone status")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get paginated customers for a business
 */
export async function findBusinessCustomersPaginated(businessId, filter, options) {
  const data = await BusinessCustomer.paginate(
    {
      businessId,
      ...filter,
    },
    options,
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
    .populate("businessId", "name email")
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

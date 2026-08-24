import bcrypt from "bcrypt";
import * as customerRepo from "../repository/customer.repository.js";
import * as roleRepo from "../repository/role.repository.js";
import { logger } from "../utils/logger.js";

/**
 * Create a new customer (Business only)
 * Auto-verified, no OTP required
 */
export const createCustomer = async (businessId, { name, email, password, phone }) => {
  // Check if email already exists
  const existingCustomer = await customerRepo.findCustomerByEmail(email);
  if (existingCustomer) {
    const error = new Error("Email is already registered");
    error.status = 409;
    logger("customer", "Create customer failed - email exists", { email, businessId });
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get customer role
  const role = await roleRepo.findRoleByName("customer");
  if (!role) {
    const error = new Error("Customer role not found");
    error.status = 400;
    throw error;
  }

  // Create customer (auto-verified)
  const created = await customerRepo.createCustomer({
    name,
    email,
    password: hashedPassword,
    phone: phone && phone.trim() ? phone.trim() : undefined,
    businessId,
    role: role._id,
    createdBy: "business",
    isVerified: true,
  });

  logger("customer", "Customer created by business", { email, businessId });

  return {
    success: true,
    data: {
      id: created._id,
      email: created.email,
      name: created.name,
      status: created.status,
    },
    message: "Customer account created successfully",
  };
};

/**
 * List all customers for a business with pagination and filtering
 */
export const listCustomers = async (businessId, { page, limit, search, status }) => {
  const filter = {
    isDeleted: false,
    businessId,
    ...(status && { status }),
    ...(search && {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    }),
  };

  const options = {
    page,
    limit,
    sort: { createdAt: -1 },
    select: "-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires",
    populate: { path: "role", select: "name permissions" },
  };

  try {
    const result = await customerRepo.listCustomers(filter, options);
    logger("customer", "Customers listed", { businessId, page, limit });

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
  } catch (err) {
    logger("customer", "Failed to list customers", {
      businessId,
      error: err.message,
    });
    throw err;
  }
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (id) => {
  const customer = await customerRepo.findCustomerById(id);

  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    logger("customer", "Customer not found", { customerId: id });
    throw error;
  }

  return {
    success: true,
    data: customer,
    message: "Customer fetched successfully",
  };
};

/**
 * Update customer
 */
export const updateCustomer = async (id, updateData) => {
  const customer = await customerRepo.findCustomerById(id);

  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    logger("customer", "Update failed - customer not found", { customerId: id });
    throw error;
  }

  // Check if trying to change email to already registered one
  if (updateData.email && updateData.email !== customer.email) {
    const existingCustomer = await customerRepo.findCustomerByEmail(
      updateData.email,
    );
    if (existingCustomer) {
      const error = new Error("Email is already registered");
      error.status = 409;
      logger("customer", "Update failed - email exists", {
        customerId: id,
        email: updateData.email,
      });
      throw error;
    }
  }

  // Hash password if provided
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updated = await customerRepo.updateCustomer(id, updateData);

  logger("customer", "Customer updated", { customerId: id });

  return {
    success: true,
    data: updated,
    message: "Customer updated successfully",
  };
};

/**
 * Delete/Deactivate customer
 */
export const deleteCustomer = async (id) => {
  const customer = await customerRepo.findCustomerById(id);

  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    logger("customer", "Delete failed - customer not found", { customerId: id });
    throw error;
  }

  const deleted = await customerRepo.deleteCustomer(id);

  logger("customer", "Customer deleted", { customerId: id });

  return {
    success: true,
    data: null,
    message: "Customer deleted successfully",
  };
};

/**
 * Change customer password
 */
export const changePassword = async (customerId, currentPassword, newPassword) => {
  const customer = await customerRepo.findCustomerByIdWithPassword(customerId);

  if (!customer) {
    const error = new Error("Customer not found");
    error.status = 404;
    throw error;
  }

  // Verify current password
  const isPasswordMatch = await bcrypt.compare(currentPassword, customer.password);
  if (!isPasswordMatch) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    logger("customer", "Change password failed - incorrect current password", { customerId });
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await customerRepo.updateCustomer(customerId, { password: hashedPassword });

  logger("customer", "Password changed successfully", { customerId });

  return {
    success: true,
    data: null,
    message: "Password changed successfully",
  };
};

/**
 * Get customer's activity history (all loyalty requests they've made)
 */
export const getActivityHistory = async (customerId, { page, limit, status }) => {
  try {
    const loyaltyRequestRepo = await import("../repository/loyaltyrequest.repository.js");

    const filter = {
      ...(status && { status }),
    };

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
    };

    const result = await loyaltyRequestRepo.findLoyaltyRequestsByCustomerPaginated(
      customerId,
      filter,
      options,
    );

    logger("customer", "Activity history fetched", { customerId, page, limit });

    return {
      success: true,
      data: result.docs,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
      },
      message: "Activity history fetched successfully",
    };
  } catch (err) {
    logger("customer", "Failed to fetch activity history", {
      customerId,
      error: err.message,
    });
    throw err;
  }
};

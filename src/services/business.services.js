import bcrypt from "bcrypt";
import * as businessRepo from "../repository/business.repository.js";
import * as roleRepo from "../repository/role.repository.js";
import { logger } from "../utils/logger.js";

/**
 * Create a new business (Admin only)
 * Auto-verified, no OTP required
 */
export const createBusiness = async ({ name, email, password, phone }) => {
  // Check if email already exists
  const existingBusiness = await businessRepo.findBusinessByEmail(email);
  if (existingBusiness) {
    const error = new Error("Email is already registered");
    error.status = 409;
    logger("business", "Create business failed - email exists", { email });
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get business role
  const role = await roleRepo.findRoleByName("business");
  if (!role) {
    const error = new Error("Business role not found");
    error.status = 400;
    throw error;
  }

  // Create business (auto-verified)
  const created = await businessRepo.createBusiness({
    name,
    email,
    password: hashedPassword,
    phone: phone && phone.trim() ? phone.trim() : undefined,
    role: role._id,
    createdBy: "admin",
    isVerified: true,
  });

  logger("business", "Business created by admin", { email });

  return {
    success: true,
    data: {
      id: created._id,
      email: created.email,
      name: created.name,
      status: created.status,
    },
    message: "Business account created successfully",
  };
};

/**
 * List all businesses with pagination and filtering
 */
export const listBusinesses = async ({ page, limit, search, status }) => {
  const filter = {
    isDeleted: false,
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
    const result = await businessRepo.listBusinesses(filter, options);
    logger("business", "Businesses listed", { page, limit });

    return {
      success: true,
      data: result.docs,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        pages: result.totalPages,
      },
      message: "Businesses fetched successfully",
    };
  } catch (err) {
    logger("business", "Failed to list businesses", { error: err.message });
    throw err;
  }
};

/**
 * Get business by ID
 */
export const getBusinessById = async (id) => {
  const business = await businessRepo.findBusinessById(id);

  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("business", "Business not found", { businessId: id });
    throw error;
  }

  return {
    success: true,
    data: business,
    message: "Business fetched successfully",
  };
};

/**
 * Update business
 */
export const updateBusiness = async (id, updateData) => {
  const business = await businessRepo.findBusinessById(id);

  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("business", "Update failed - business not found", { businessId: id });
    throw error;
  }

  // Check if trying to change email to already registered one
  if (updateData.email && updateData.email !== business.email) {
    const existingBusiness = await businessRepo.findBusinessByEmail(
      updateData.email,
    );
    if (existingBusiness) {
      const error = new Error("Email is already registered");
      error.status = 409;
      logger("business", "Update failed - email exists", {
        businessId: id,
        email: updateData.email,
      });
      throw error;
    }
  }

  // Hash password if provided
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updated = await businessRepo.updateBusiness(id, updateData);

  logger("business", "Business updated", { businessId: id });

  return {
    success: true,
    data: updated,
    message: "Business updated successfully",
  };
};

/**
 * Delete/Deactivate business
 */
export const deleteBusiness = async (id) => {
  const business = await businessRepo.findBusinessById(id);

  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("business", "Delete failed - business not found", { businessId: id });
    throw error;
  }

  const deleted = await businessRepo.deleteBusiness(id);

  logger("business", "Business deleted", { businessId: id });

  return {
    success: true,
    data: null,
    message: "Business deleted successfully",
  };
};

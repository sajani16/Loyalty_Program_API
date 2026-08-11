import * as productRepo from "../repository/product.repository.js";
import * as businessRepo from "../repository/business.repository.js";
import { logger } from "../utils/logger.js";

/**
 * Create a new product (Business only)
 */
export const createProduct = async (businessId, productData) => {
  // Verify business exists
  const business = await businessRepo.findBusinessById(businessId);
  if (!business) {
    const error = new Error("Business not found");
    error.status = 404;
    logger("product", "Product creation failed - business not found", {
      businessId,
    });
    throw error;
  }

  // Check for duplicate product name
  const existingProduct = await productRepo.findProductByBusinessAndName(
    businessId,
    productData.name,
  );
  if (existingProduct) {
    const error = new Error("Product with this name already exists for your business");
    error.status = 409;
    logger("product", "Product creation failed - duplicate name", {
      businessId,
      name: productData.name,
    });
    throw error;
  }

  const product = await productRepo.createProduct({
    businessId,
    ...productData,
  });

  logger("product", "Product created", {
    businessId,
    productId: product._id,
    name: product.name,
  });

  return {
    success: true,
    data: product,
    message: "Product created successfully",
  };
};

/**
 * Get product by ID
 */
export const getProduct = async (productId) => {
  const product = await productRepo.findProductById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    logger("product", "Product not found", { productId });
    throw error;
  }

  return {
    success: true,
    data: product,
    message: "Product fetched successfully",
  };
};

/**
 * Get all products for a business
 */
export const getBusinessProducts = async (businessId, isActive = true, page, limit) => {
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  const options = {
    page: page || 1,
    limit: limit || 10,
    sort: { name: 1 },
  };

  const result = await productRepo.findProductsByBusinessPaginated(
    businessId,
    filter,
    options,
  );

  logger("product", "Business products retrieved", {
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
    message: "Products fetched successfully",
  };
};

/**
 * Get stamp-eligible products for a business
 */
export const getStampEligibleProducts = async (businessId) => {
  const products = await productRepo.findStampEligibleProducts(businessId);

  logger("product", "Stamp-eligible products retrieved", {
    businessId,
    count: products.length,
  });

  return {
    success: true,
    data: products,
    message: "Stamp-eligible products fetched successfully",
  };
};

/**
 * Update a product (Business only)
 */
export const updateProduct = async (businessId, productId, updateData) => {
  const product = await productRepo.findProductById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    logger("product", "Product update failed - not found", { productId });
    throw error;
  }

  // Verify ownership
  if (product.businessId.toString() !== businessId) {
    const error = new Error("Forbidden - not your product");
    error.status = 403;
    logger("product", "Unauthorized product update", {
      businessId,
      productId,
      actualBusinessId: product.businessId,
    });
    throw error;
  }

  // Check for duplicate name if name is being updated
  if (updateData.name && updateData.name !== product.name) {
    const existingProduct = await productRepo.findProductByBusinessAndName(
      businessId,
      updateData.name,
    );
    if (existingProduct) {
      const error = new Error("Product with this name already exists");
      error.status = 409;
      throw error;
    }
  }

  const updated = await productRepo.updateProduct(productId, updateData);

  logger("product", "Product updated", {
    businessId,
    productId,
  });

  return {
    success: true,
    data: updated,
    message: "Product updated successfully",
  };
};

/**
 * Delete a product (Business only)
 */
export const deleteProduct = async (businessId, productId) => {
  const product = await productRepo.findProductById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    logger("product", "Product deletion failed - not found", { productId });
    throw error;
  }

  // Verify ownership
  if (product.businessId.toString() !== businessId) {
    const error = new Error("Forbidden - not your product");
    error.status = 403;
    logger("product", "Unauthorized product deletion", {
      businessId,
      productId,
    });
    throw error;
  }

  await productRepo.deleteProduct(productId);

  logger("product", "Product deleted", {
    businessId,
    productId,
  });

  return {
    success: true,
    data: null,
    message: "Product deleted successfully",
  };
};

/**
 * Toggle product active status (Business only)
 */
export const toggleProductStatus = async (businessId, productId, isActive) => {
  const product = await productRepo.findProductById(productId);

  if (!product) {
    const error = new Error("Product not found");
    error.status = 404;
    throw error;
  }

  // Verify ownership
  if (product.businessId.toString() !== businessId) {
    const error = new Error("Forbidden - not your product");
    error.status = 403;
    throw error;
  }

  const updated = await productRepo.updateProduct(productId, { isActive });

  logger("product", "Product status updated", {
    businessId,
    productId,
    isActive,
  });

  return {
    success: true,
    data: updated,
    message: `Product ${isActive ? "activated" : "deactivated"} successfully`,
  };
};

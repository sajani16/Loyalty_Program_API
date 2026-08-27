import Product from "../models/Product.js";

/**
 * Create a new product
 */
export async function createProduct(productObj) {
  const product = new Product(productObj);
  return product.save();
}

/**
 * Find product by ID
 */
export async function findProductById(id) {
  return Product.findById(id)
    .select("_id businessId name price stampEligible stampTarget rewardQuantity isActive")
    .lean();
}

/**
 * Find product by businessId and name
 */
export async function findProductByBusinessAndName(businessId, name) {
  return Product.findOne({ businessId, name })
    .select("_id businessId name price stampEligible stampTarget rewardQuantity isActive")
    .lean();
}

/**
 * Get all products for a business
 */
export async function findProductsByBusiness(businessId, filter = {}) {
  return Product.find({
    businessId,
    ...filter,
  })
    .select("_id businessId name price stampEligible stampTarget rewardQuantity isActive")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get paginated products for a business
 */
export async function findProductsByBusinessPaginated(businessId, filter, options) {
  const data = await Product.paginate(
    {
      businessId,
      ...filter,
    },
    {
      ...options,
      select: "_id businessId name price stampEligible stampTarget rewardQuantity isActive",
    },
  );
  return data;
}

/**
 * Get active stamp-eligible products for a business
 */
export async function findStampEligibleProducts(businessId) {
  return Product.find({
    businessId,
    stampEligible: true,
    isActive: true,
  })
    .select("_id businessId name price stampTarget rewardQuantity")
    .sort({ name: 1 })
    .lean();
}

/**
 * Update a product
 */
export async function updateProduct(id, updateData) {
  return Product.findByIdAndUpdate(id, updateData, {
    new: true,
  })
    .select("_id businessId name price stampEligible stampTarget rewardQuantity isActive")
    .lean();
}

/**
 * Delete a product (soft or hard)
 */
export async function deleteProduct(id) {
  return Product.findByIdAndDelete(id).lean();
}

/**
 * Check if product exists
 */
export async function productExists(id) {
  const count = await Product.countDocuments({ _id: id });
  return count > 0;
}

/**
 * Get product count for a business
 */
export async function getProductCount(businessId) {
  return Product.countDocuments({ businessId, isActive: true });
}

/**
 * Get active products for a business
 */
export async function getActiveProducts(businessId) {
  return Product.find({
    businessId,
    isActive: true,
  })
    .select("_id businessId name price stampEligible stampTarget rewardQuantity")
    .sort({ name: 1 })
    .lean();
}

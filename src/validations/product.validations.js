import { z } from "zod";

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  price: z.number().min(0, "Price must be at least 0"),
  stampEligible: z.boolean().optional().default(false),
  stampTarget: z
    .number()
    .min(1, "Stamp target must be at least 1")
    .optional()
    .nullable(),
  rewardQuantity: z
    .number()
    .min(1, "Reward quantity must be at least 1")
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

export const validateProductInput = (data) => {
  try {
    const value = ProductSchema.parse(data);
    return { error: null, value };
  } catch (err) {
    return {
      error: {
        message: err.errors?.[0]?.message || "Validation failed",
      },
      value: null,
    };
  }
};

export const validateProductUpdate = (data) => {
  try {
    const UpdateSchema = ProductSchema.partial();
    const value = UpdateSchema.parse(data);
    return { error: null, value };
  } catch (err) {
    return {
      error: {
        message: err.errors?.[0]?.message || "Validation failed",
      },
      value: null,
    };
  }
};

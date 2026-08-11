import { z } from "zod";

const LoyaltyRequestProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required").trim(),
  unitPrice: z.number().min(0, "Unit price must be at least 0"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const LoyaltyRequestSchema = z.object({
  products: z
    .array(LoyaltyRequestProductSchema)
    .min(1, "At least one product is required"),
  expiresAt: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, "Invalid expiration date"),
});

export const validateLoyaltyRequestInput = (data) => {
  try {
    const value = LoyaltyRequestSchema.parse(data);
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

const CompletionSchema = z.object({
  pointsAwarded: z.number().min(0, "Points must be at least 0"),
  stampsAwarded: z.number().min(0, "Stamps must be at least 0"),
});

export const validateCompletionInput = (data) => {
  try {
    const value = CompletionSchema.parse(data);
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

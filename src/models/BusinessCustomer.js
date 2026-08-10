import mongoose from "mongoose";

const BusinessCustomerSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "blocked"],
      default: "pending",
    },
    points: {
      type: Number,
      default: 0,
    },
    stamps: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      default: "basic",
      // Can be extended: basic, silver, gold, platinum
    },
    joinedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Compound unique index: A customer cannot belong to the same business more than once
BusinessCustomerSchema.index(
  { businessId: 1, customerId: 1 },
  { unique: true }
);

export default mongoose.model("BusinessCustomer", BusinessCustomerSchema);

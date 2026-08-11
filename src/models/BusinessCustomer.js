import mongoose from "mongoose";

const StampCardSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedCards: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

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
      min: 0,
    },
    tier: {
      type: String,
      enum: ["basic", "silver", "gold", "platinum"],
      default: "basic",
    },
    stampCards: {
      type: [StampCardSchema],
      default: [],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

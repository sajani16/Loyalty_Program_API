import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const LoyaltyRequestProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    stamps: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const LoyaltyRequestSchema = new mongoose.Schema(
  {
    businessCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCustomer",
      required: true,
      index: true,
    },
    products: {
      type: [LoyaltyRequestProductSchema],
      default: [],
    },
    amountSpent: {
      type: Number,
      default: null,
      min: 0,
    },
    pointsAwarded: {
      type: Number,
      default: null,
      min: 0,
    },
    stampsAwarded: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

LoyaltyRequestSchema.plugin(mongoosePaginate);

export default mongoose.model("LoyaltyRequest", LoyaltyRequestSchema);

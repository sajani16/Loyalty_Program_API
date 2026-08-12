import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const ProductSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stampEligible: {
      type: Boolean,
      default: false,
    },
    stampTarget: {
      type: Number,
      default: null,
      min: 1,
    },
    rewardQuantity: {
      type: Number,
      default: null,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

ProductSchema.plugin(mongoosePaginate);

// Compound unique index: Business cannot have duplicate product names
ProductSchema.index({ businessId: 1, name: 1 }, { unique: true });

export default mongoose.model("Product", ProductSchema);

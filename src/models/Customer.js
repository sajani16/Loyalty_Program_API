import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const CustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      // Will be set to customer role
    },
    
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true },
);

CustomerSchema.index({ email: 1, isDeleted: 1 }, { unique: true });
CustomerSchema.plugin(mongoosePaginate);

export default mongoose.model("Customer", CustomerSchema);

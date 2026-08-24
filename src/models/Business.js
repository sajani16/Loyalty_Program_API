import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const BusinessSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },
    businessLogo: {
      type: String,
      default: null,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      // Will be set to business role
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

BusinessSchema.index({ email: 1, isDeleted: 1 }, { unique: true });
BusinessSchema.plugin(mongoosePaginate);

export default mongoose.model("Business", BusinessSchema);

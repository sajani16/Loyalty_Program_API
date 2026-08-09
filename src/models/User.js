import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: {
      type: String,
      sparse: true,
      index: true,
    },
    // companyLogo: {
    //   type: String,
    //   trim: true,
    //   default: null,
    // },
    userType: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
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

UserSchema.index({ email: 1, isDeleted: 1 }, { unique: true });

UserSchema.plugin(mongoosePaginate);

export default mongoose.model("User", UserSchema);

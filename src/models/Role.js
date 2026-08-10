import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["admin", "superadmin", "business", "customer"],
      unique: true,
      required: true,
    },
    description: { type: String },
    permissions: [
      {
        type: String,
        // Examples: "users:create", "users:read", "businesses:create", "customers:manage"
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Role", RoleSchema);

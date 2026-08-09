import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const LogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    user: { type: String },
    details: { type: Object },
    ip: { type: String },
  },
  { timestamps: true },
);

LogSchema.plugin(mongoosePaginate);

export default mongoose.model("Log", LogSchema);

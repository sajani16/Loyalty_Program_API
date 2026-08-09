import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

export default async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {});
    // logger("system", "MongoDB connected");
    console.log("MongoDB connected");
    console.log("Connected to DB:", MONGO_URI);
  } catch (err) {
    // logger("system", "MongoDB connection error", { error: err.message });
    console.error("MongoDB connection error", err);
    process.exit(1);
  }
}

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/database.js";
import { initializeRoles } from "../repository/role.repository.js";

async function seedRoles() {
  try {
    await connectDB();
    await initializeRoles();
    console.log("Role seed completed successfully");
  } catch (error) {
    console.error("Role seed failed", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seedRoles();

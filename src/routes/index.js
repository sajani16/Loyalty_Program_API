import { Router } from "express";
import authRoutes from "./auth.routes.js";
import businessRoutes from "./business.routes.js";
import customerRoutes from "./customer.routes.js";
import userRoutes from "./user.routes.js";
import bcRoutes from "./businesscustomer.routes.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/businesses", businessRoutes);
routes.use("/customers", customerRoutes);
routes.use("/users", userRoutes);
routes.use("/memberships", bcRoutes);

export default routes;
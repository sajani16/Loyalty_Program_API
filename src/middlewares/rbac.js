import { logger } from "../utils/logger.js";

/**
 * Check if the authenticated user has one of the allowed roles.
 * Superadmin and Admin roles bypass or satisfy business role checks.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const userRole = user.role?.name;

      // Superadmin or admin bypasses role check for business endpoints
      if (
        userRole === "superadmin" ||
        user.superadmin === true ||
        (userRole === "admin" && (allowedRoles.includes("business") || allowedRoles.includes("admin")))
      ) {
        return next();
      }

      if (!userRole || !allowedRoles.includes(userRole)) {
        logger("rbac", "Role check failed", {
          userId: user.id,
          userRole,
          allowedRoles,
        });

        return res.status(403).json({
          success: false,
          message: `Forbidden - requires one of: ${allowedRoles.join(", ")}`,
        });
      }

      next();
    } catch (error) {
      logger("rbac", "Permission check failed", {
        error: error.message,
      });

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

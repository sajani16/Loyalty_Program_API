import { logger } from "../utils/logger.js";

/**
 * RBAC Middleware - checks if user has required permission
 * Usage: authorize("permission:action")(req, res, next)
 */
export const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check if user has role populated
      if (!user.role) {
        logger("rbac", "User has no role assigned", { userId: user.id });
        return res.status(403).json({
          success: false,
          message: "Forbidden - no role assigned",
        });
      }

      // Get user's permissions from role
      const userPermissions = user.role.permissions || [];

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        logger("rbac", "Permission denied", {
          userId: user.id,
          required: requiredPermissions,
          userPermissions,
        });
        return res.status(403).json({
          success: false,
          message: "Forbidden - insufficient permissions",
        });
      }

      next();
    } catch (err) {
      logger("rbac", "RBAC check failed", { error: err.message });
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

/**
 * Check if user has a specific role
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Get user's role name
      const userRole = user.role?.name;

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
    } catch (err) {
      logger("rbac", "Role check error", { error: err.message });
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

import { logger } from "../utils/logger.js";

//  Check if the authenticated user has the required permission later if we break business into staff manager admin

// export const authorize = (...requiredPermissions) => {
//   return (req, res, next) => {
//     try {
//       const user = req.user;

//       if (!user) {
//         return res.status(401).json({
//           success: false,
//           message: "Unauthorized",
//         });
//       }

//       // Superadmin bypasses all permission checks
//       if (user.role?.name === "superadmin" || user.superadmin === true) {
//         return next();
//       }

//       if (!user.role) {
//         logger("rbac", "User has no role assigned", {
//           userId: user.id,
//         });

//         return res.status(403).json({
//           success: false,
//           message: "Forbidden - no role assigned",
//         });
//       }

//       const userPermissions = user.role.permissions || [];

//       const hasPermission = requiredPermissions.some((permission) =>
//         userPermissions.includes(permission),
//       );

//       if (!hasPermission) {
//         logger("rbac", "Permission denied", {
//           userId: user.id,
//           role: user.role.name,
//           requiredPermissions,
//         });

//         return res.status(403).json({
//           success: false,
//           message: "Forbidden - insufficient permissions",
//         });
//       }

//       next();
//     } catch (error) {
//       logger("rbac", "Permission check failed", {
//         error: error.message,
//       });

//       return res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       });
//     }
//   };
// };

// Check if the authenticated user has one of the allowed role same as checking userType
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

      // Superadmin bypasses all role checks
      if (user.role?.name === "superadmin" || user.superadmin === true) {
        return next();
      }

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
    } catch (error) {
      logger("rbac", "Role check failed", {
        error: error.message,
      });

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

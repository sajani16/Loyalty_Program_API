import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

/**
 * Initialize Socket.IO with standard practices
 */
export const initializeLoyaltySocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // ============ MIDDLEWARE: Authentication ==========
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger("websocket", "Connection rejected - no token", {
          socketId: socket.id,
        });
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

      socket.userId = decoded.id;
      socket.userType = decoded.userType;
      socket.email = decoded.email;
      socket.role = decoded.role;

      logger("websocket", "Socket authenticated", {
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType,
      });

      next();
    } catch (err) {
      logger("websocket", "Socket authentication failed", {
        socketId: socket.id,
        error: err.message,
      });
      next(new Error("Invalid or expired token"));
    }
  });

  // ============ NAMESPACE: /loyalty ==========
  const loyaltyNS = io.of("/loyalty");

  loyaltyNS.on("connection", (socket) => {
    logger("websocket", "Merchant connected to /loyalty", {
      socketId: socket.id,
    });

    // EVENT: merchant:join
    socket.on("merchant:join", (data, callback) => {
      try {
        const { businessId } = data;

        if (!businessId) {
          logger("websocket", "Merchant join failed - no businessId", {
            socketId: socket.id,
          });
          return callback({ success: false, error: "businessId is required" });
        }

        if (socket.userType !== "business") {
          logger("websocket", "Non-business tried to join merchant room", {
            socketId: socket.id,
            userType: socket.userType,
          });
          return callback({
            success: false,
            error: "Only business accounts can join as merchant",
          });
        }

        socket.join(`business:${businessId}`);
        socket.businessId = businessId;

        const activeConnections = loyaltyNS.adapter.rooms.get(
          `business:${businessId}`,
        )?.size || 1;

        logger("websocket", "Merchant joined room", {
          socketId: socket.id,
          businessId,
          activeConnections,
        });

        callback({
          success: true,
          message: "Successfully joined merchant dashboard",
          businessId,
          activeConnections,
        });
      } catch (err) {
        logger("websocket", "Error in merchant:join", {
          socketId: socket.id,
          error: err.message,
        });
        callback({ success: false, error: err.message });
      }
    });

    // EVENT: disconnect
    socket.on("disconnect", () => {
      try {
        if (socket.businessId) {
          const activeConnections = loyaltyNS.adapter.rooms.get(
            `business:${socket.businessId}`,
          )?.size || 0;

          logger("websocket", "Merchant disconnected", {
            socketId: socket.id,
            businessId: socket.businessId,
            remainingConnections: activeConnections,
          });
        }
      } catch (err) {
        logger("websocket", "Error in disconnect handler", {
          error: err.message,
        });
      }
    });

    // EVENT: ping (heartbeat)
    socket.on("ping", (callback) => {
      callback({ status: "pong", timestamp: new Date().toISOString() });
    });
  });

  return io;
};

// ============ EMISSION FUNCTIONS ==========

/**
 * Emit new loyalty request to all merchants of a business
 */
export const emitNewLoyaltyRequest = (io, businessId, requestData) => {
  try {
    io.of("/loyalty").to(`business:${businessId}`).emit("request:new", {
      requestId: requestData.requestId,
      businessCustomerId: requestData.businessCustomerId,
      customer: {
        id: requestData.customerId,
        email: requestData.customerEmail,
        name: requestData.customerName,
      },
      loyalty: {
        points: requestData.currentPoints,
        tier: requestData.currentTier,
        stampCards: requestData.stampCards || [],
      },
      expiresAt: requestData.expiresAt,
      timestamp: new Date().toISOString(),
    });

    const recipientCount =
      io.of("/loyalty").adapter.rooms.get(`business:${businessId}`)?.size || 0;
    logger("websocket", "New request emitted", {
      businessId,
      requestId: requestData.requestId,
      recipients: recipientCount,
    });
  } catch (err) {
    logger("websocket", "Error emitting new request", {
      businessId,
      error: err.message,
    });
  }
};

/**
 * Emit request completion to all merchants of a business
 */
export const emitRequestCompleted = (io, businessId, completionData) => {
  try {
    io.of("/loyalty").to(`business:${businessId}`).emit("request:completed", {
      requestId: completionData.requestId,
      status: "completed",
      type: completionData.type,
      loyalty: {
        pointsAwarded: completionData.pointsAwarded,
        stampsAwarded: completionData.stampsAwarded,
        newPoints: completionData.customerUpdate.newPoints,
        newTier: completionData.customerUpdate.newTier,
        stampCards: completionData.customerUpdate.stampCards,
      },
      timestamp: new Date().toISOString(),
    });

    logger("websocket", "Request completion emitted", {
      businessId,
      requestId: completionData.requestId,
    });
  } catch (err) {
    logger("websocket", "Error emitting completion", {
      businessId,
      error: err.message,
    });
  }
};

/**
 * Emit request rejection to all merchants of a business
 */
export const emitRequestRejected = (io, businessId, requestId, reason) => {
  try {
    io.of("/loyalty").to(`business:${businessId}`).emit("request:rejected", {
      requestId,
      status: "rejected",
      reason,
      timestamp: new Date().toISOString(),
    });

    logger("websocket", "Request rejection emitted", {
      businessId,
      requestId,
    });
  } catch (err) {
    logger("websocket", "Error emitting rejection", {
      businessId,
      error: err.message,
    });
  }
};

/**
 * Get active merchant connections count for a business
 */
export const getBusinessConnectionCount = (io, businessId) => {
  try {
    const room = io.of("/loyalty").adapter.rooms.get(`business:${businessId}`);
    return room ? room.size : 0;
  } catch (err) {
    logger("websocket", "Error getting connection count", {
      businessId,
      error: err.message,
    });
    return 0;
  }
};

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";
import Business from "../models/Business.js";

let io;

export const initializeLoyaltySocket = (httpServer) => {
  if (io) return io;
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });
  //namespacing
  const loyaltyNS = io.of("/loyalty");

  //auth middleware to authenticate create socket server and attach user to socket
  loyaltyNS.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = {
        userId: decoded.sub || decoded.id,
        email: decoded.email,
        role: decoded.role,
        userType: decoded.userType,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  // when anyone run this they get add to user room
  loyaltyNS.on("connection", (socket) => {
    // Every authenticated user gets a personal room
    socket.join(`user:${socket.user.userId}`);

    socket.on("business:join", async (data, callback) => {
      try {
        const { businessId } = data;

        if (!businessId) {
          return callback({
            success: false,
            error: "businessId is required",
          });
        }

        // Must be a business account
        if (socket.user.userType !== "business") {
          return callback({
            success: false,
            error: "Only business accounts can join business rooms",
          });
        }

        // Business account can only join its own room
        if (socket.user.userId.toString() !== businessId.toString()) {
          return callback({
            success: false,
            error: "You are not authorized to join this business room",
          });
        }

        // Verify business actually exists and is active
        const business = await Business.findOne({
          _id: businessId,
          status: "active",
          isDeleted: false,
        });

        if (!business) {
          return callback({
            success: false,
            error: "Business not found or inactive",
          });
        }

        // Authorized
        socket.join(`business:${businessId}`);
        socket.businessId = businessId;

        callback({
          success: true,
          businessId,
        });
      } catch (error) {
        callback({
          success: false,
          error: "Failed to join business room",
        });
      }
    });

    socket.on("disconnect", (reason) => {
      logger("websocket", "Socket disconnected", {
        socketId: socket.id,
        userId: socket.user.userId,
        reason,
      });
    });
  });
  return io;
};
export const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};
export const emitNewLoyaltyRequest = (businessId, requestData) => {
  const io = getIo();
  io.of("/loyalty")
    .to(`business:${businessId}`)
    .emit("request:new", {
      requestId: requestData.requestId,

      customer: {
        id: requestData.customerId,
        name: requestData.customerName,
      },

      expiresAt: requestData.expiresAt,

      timestamp: new Date().toISOString(),
    });
};

// Merchant completed request → update customer
export const emitRequestCompleted = (customerId, requestData) => {
  const io = getIo();
  io.of("/loyalty")
    .to(`user:${customerId}`)
    .emit("request:completed", {
      requestId: requestData.requestId,
      status: "completed",

      loyalty: {
        points: requestData.points,
        stamps: requestData.stamps,
        reward: requestData.reward,
      },

      timestamp: new Date().toISOString(),
    });
};
// Merchant rejected request → notify customer
export const emitRequestRejected = (customerId, requestData) => {
  const io = getIo();
  io.of("/loyalty")
    .to(`user:${customerId}`)
    .emit("request:rejected", {
      requestId: requestData.requestId,
      status: "rejected",
      reason: requestData.reason || null,
      timestamp: new Date().toISOString(),
    });
};

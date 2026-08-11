import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import http from "http";
import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import { initializeLoyaltySocket } from "./websocket/loyaltySocket.js";
import "./config/firebase.js";

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Connect DB
connectDB();

// ============ MIDDLEWARES ==========
app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      if (req.url?.includes("/webhooks/")) {
        req.rawBody = buf.toString();
      }
    },
  }),
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({ origin: "*" }));
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});
app.use(limiter);
app.use(morgan("dev"));

// ============ ROUTES ==========
app.use("/api", routes);
app.get("/", (req, res) =>
  res.json({ ok: true, message: "All system functional" }),
);

// ============ SOCKET.IO INITIALIZATION ==========
const io = initializeLoyaltySocket(httpServer);

// Make io available globally for services
global.io = io;

// ============ ERROR HANDLER ==========
app.use(errorHandler);

// ============ SERVER START ==========
httpServer.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}`);
});

import "dotenv/config";
import express, { Router } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
// import { logger } from "./utils/logger.js";
import connectDB from "./config/database.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import http from "http";
// import { initSocket } from "./src/sockets/notification.socket.js";
import "./config/firebase.js";
// import  seedDefaults  from "./src/config/seed.js";

const app = express();
// const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Connect DB
connectDB();
// seedDefaults();

// Middlewares

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      // Store raw body for webhook signature verification
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

// Routes
app.use("/api", routes);
app.get("/", (req, res) =>
  res.json({ ok: true, message: "All system functional" }),
);
// Error handler
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// initSocket(httpServer, {
//   corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
//   redisUrl: process.env.REDIS_URL,
// });

// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const nodeRoutes = require("./src/routes/nodeRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const settingsRoutes = require("./src/routes/settingsRoutes");
const readingRoutes = require("./src/routes/readingRoutes");
const simulationRoutes = require("./src/routes/simulationRoutes");
const ingestRoutes = require("./src/routes/ingestRoutes");
const errorHandler = require("./src/middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Database ────────────────────────────────────────────────
connectDB();

// ─── CORS ────────────────────────────────────────────────────
// Allow the Vercel frontend, Wokwi simulator, and localhost dev
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://wokwi.com",
  "https://wokwi-server.wokwi.com",
  process.env.FRONTEND_URL, // e.g. https://leak-dashboard-system.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some((o) => origin === o || origin.endsWith(".vercel.app"))) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────
const apiRouter = express.Router();

// IoT / Wokwi ingest — no JWT required, uses device secret
apiRouter.use("/ingest", ingestRoutes);

// Authenticated routes
apiRouter.use("/auth", authRoutes);
apiRouter.use("/nodes", nodeRoutes);
apiRouter.use("/alerts", alertRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/", settingsRoutes);
apiRouter.use("/readings", readingRoutes);
apiRouter.use("/simulation", simulationRoutes);

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRouter);
app.use("/", apiRouter); // fallback for Vercel routing

// ─── Error Handlers ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use(errorHandler);

// ─── Start Server (local dev) ─────────────────────────────────
// In Vercel serverless mode, the file is imported as a module
// and `app.listen()` is not called — Vercel manages that.
if (process.env.NODE_ENV !== "production" || process.env.FORCE_LISTEN) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ─── Export for Vercel Serverless ────────────────────────────
module.exports = app;

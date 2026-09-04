require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const userRoutes = require("./routes/userRoutes");
const driverRoutes = require("./routes/driver.routes");
const unitRoutes = require("./routes/unit.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const fuelRoutes = require("./routes/fuel.routes");
const remittanceRoutes = require("./routes/remittance.routes");
const maintenanceRoutes = require("./routes/maintenance.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const repairHistoryRoutes = require("./routes/repairHistory.routes");

const revenueRoutes = require("./routes/revenueRoutes");
const express = require("express");
const cors = require("cors");
const http = require("http");

const notesRoutes = require("./routes/notesRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db.js");
const path = require("path");
const rateLimiterFactory = require("./middleware/rateLimiter");
const { createRatelimit } = require('./config/upstash');
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./socket/socket");

// Create a stricter limiter for dashboard endpoints (to prevent dashboard spamming)
const dashboardLimiter = rateLimiterFactory.withLimiter(createRatelimit(20, '1 m'), { allowAnalyticsPoll: true });

// Global default limiter (applied after socket and public paths are allowed)
const globalLimiter = rateLimiterFactory.default;



const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

// Apply middleware order carefully: socket and health/public routes first, then rate limiter for others
app.use(cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
}));
app.use(express.json()); // Middleware to parse JSON request bodies

// Public or health routes that should not be rate-limited
app.get('/health', (req, res) => res.json({ ok: true }));

// Mount socket.io path before global limit to avoid blocking handshake
app.use('/socket.io', (req, res, next) => next());

// Apply global rate limiter to all subsequent routes
//app.use(globalLimiter);

// Apply a route-specific stricter limiter to analytics dashboard routes
app.use('/api/analytics/dashboard', dashboardLimiter);

app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/remittances", remittanceRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/repair-history", repairHistoryRoutes);

app.use("/api/notes", notesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/revenue", revenueRoutes);

app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
  });
});

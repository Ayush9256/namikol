const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("@exortek/express-mongo-sanitize");
const mongoose = require("mongoose");
const path = require("node:path");
const fs = require("node:fs");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminMessageRoutes = require("./routes/adminMessageRoutes");

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "script-src": ["'self'", "https://checkout.razorpay.com"],
        "frame-src": ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        "connect-src": ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins = new Set([
  "https://namikol.com",
  "https://www.namikol.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use(cookieParser());
app.use(mongoSanitize());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

const frontendDirectory = path.resolve(__dirname, "../../Frontend/dist");
const serveFrontend = process.env.SERVE_FRONTEND === "true";

if (!serveFrontend) app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "NAMIKOL API is running",
  });
});

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    message: databaseConnected
      ? "NAMIKOL API is healthy"
      : "NAMIKOL database is unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin/messages", adminMessageRoutes);

if (serveFrontend) {
  if (!fs.existsSync(path.join(frontendDirectory, "index.html"))) {
    throw new Error("Frontend build missing. Run npm run build from the repository root.");
  }
  app.use(express.static(frontendDirectory));
  app.use((req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/") ||
        !["GET", "HEAD"].includes(req.method) || path.extname(req.path)) return next();
    res.sendFile(path.join(frontendDirectory, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 :
    ["CastError", "ValidationError", "MulterError"].includes(error.name) ? 400 : 500);
  res.status(status).json({
    success: false,
    message: status < 500 ? error.message : "An unexpected server error occurred.",
  });
});

module.exports = app;

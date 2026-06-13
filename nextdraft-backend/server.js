const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");

dotenv.config();

const connectDB = require("./config/db");
const { generalLimiter } = require("./middleware/rate_limit");

const app = express();

// --- Security & infra
app.set("trust proxy", 1); // needed behind Render/Vercel for correct IPs

connectDB();

// CORS: restrict to known origins; fall back to wildcard ONLY in dev
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin tools (curl, server-side) which send no origin
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== "production" && allowedOrigins.length === 0) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // API only — frontend sets its own CSP
  })
);

// Mongo sanitize - strips $ and . from req.body/query/params keys
app.use(mongoSanitize());

// Body parser size limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Loose global limiter to absorb scrape-/scan-style traffic
app.use(generalLimiter);

app.get("/", (req, res) => res.send("NextDraft API is running..."));
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Routes
app.use("/api/users", require("./routes/user_route"));
app.use("/api/resumes", require("./routes/resume_routes"));
app.use("/api/suggestions", require("./routes/suggestion_routes"));
app.use("/api/job-descriptions", require("./routes/job_description_route"));
app.use("/api/dashboard", require("./routes/dashboard_route"));
app.use("/api/payments", require("./routes/payment_route"));
app.use("/api/feedback", require("./routes/feedback_route"));
app.use("/api/admin", require("./routes/admin_route"));

// 404
app.use((req, res) => res.status(404).json({ message: "Endpoint not found" }));

// Centralized error handler — catches multer errors, CORS errors, etc.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error("[Error]", err.message);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large" });
  }
  if (err.message?.startsWith("Invalid file type")) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  return res.status(500).json({ message: "Server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

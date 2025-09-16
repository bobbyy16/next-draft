const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes placeholder
app.get("/", (req, res) => {
  res.send("NextDraft API is running...");
});

const userRoutes = require("./routes/user_route");
const resumeRoutes = require("./routes/resume_routes.js");
const suggestionRoutes = require("./routes/suggestion_routes");
const jobDescriptionRoutes = require("./routes/job_description_route");
const dashboardRoutes = require("./routes/dashboard_route");
app.use("/api/users", userRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api/job-descriptions", jobDescriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

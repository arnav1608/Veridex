// ===============================
// ENV CONFIG
// ===============================
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const path = require("path");

const app = express();

// ===============================
// DATABASE CONNECTION
// ===============================
connectDB();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// 🔥 FIXED HERE
app.use(express.static(path.join(__dirname, "../frontend")));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
  res.json({ status: "Veridex backend running" });
});

// ===============================
// API ROUTES
// ===============================

// Auth
app.use("/api/auth", require("./routes/authRoutes"));

// Claims
app.use("/claims", require("./routes/claimRoutes"));

// Sources
app.use("/sources", require("./routes/sourceRoutes"));

// Evaluation
app.use("/evaluate", require("./routes/evaluateRoutes"));

// Discussions
app.use("/discussions", require("./routes/discussionRoutes"));

// Moderator
app.use("/api/moderator", require("./routes/moderatorRoutes"));

// ===============================
// STATIC FILES
// ===============================
app.use("/uploads", express.static("uploads"));

// ===============================
// ROOT ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Veridex backend running");
});

// ===============================
// GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error"
  });
});

// ===============================
// SERVER START
// ===============================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Veridex server running on port ${PORT}`);
});
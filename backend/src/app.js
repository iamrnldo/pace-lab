// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("./config/passport");
const corsOptions = require("./config/cors");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Passport
app.use(passport.initialize());

// Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting
app.use("/api", apiLimiter);

// Routes
app.use("/api/v1", routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(errorHandler);

module.exports = app;

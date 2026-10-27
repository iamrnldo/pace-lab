// src/middleware/errorHandler.js
function errorHandler(err, req, res, _next) {
  console.error("Error:", err.message);

  if (err.code === "23505") {
    return res.status(409).json({ error: "Duplicate entry" });
  }

  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record not found" });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;

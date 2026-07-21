// src/routes/authRoutes.js
const { Router } = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = Router();

// POST /api/v1/auth/admin/login — Admin login with email/password
router.post("/admin/login", authController.adminLogin);

// GET /api/v1/auth/google — initiate OAuth (users only)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// GET /api/v1/auth/google/callback — OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed`,
    session: false,
  }),
  authController.googleCallback
);

// GET /api/v1/auth/profile — get current user
router.get("/profile", authMiddleware, authController.getProfile);

// POST /api/v1/auth/logout
router.post("/logout", authMiddleware, authController.logout);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refreshToken);

module.exports = router;

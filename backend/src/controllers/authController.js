// src/controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const jwtConfig = require("../config/jwt");
const db = require("../config/database");

function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  const refreshToken = jwt.sign({ id: user.id }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
}

const authController = {
  // ── POST /api/v1/auth/admin/login ────────────
  async adminLogin(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const { rows } = await db.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );

      const user = rows[0];

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: "Account is deactivated" });
      }

      if (!user.password_hash) {
        return res.status(401).json({ error: "Password not set. Use Google login." });
      }

      // Verify password
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login
      await db.query(
        `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
        [user.id]
      );

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [user.id, refreshToken, req.ip, req.headers["user-agent"]]
      );

      // Log activity
      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
         VALUES ($1, 'login', 'Admin login with email/password', $2, $3)`,
        [user.id, req.ip, req.headers["user-agent"]]
      );

      // Set refresh token cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  // ── GET /api/v1/auth/google ──────────────────
  // (handled by passport middleware in route)

  // ── GET /api/v1/auth/google/callback ─────────
  async googleCallback(req, res) {
    try {
      if (!req.user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      // Block admin from Google login
      if (req.user.role === "admin") {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=admin_use_form`);
      }

      const { accessToken, refreshToken } = generateTokens(req.user);

      // Store refresh token
      await db.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [req.user.id, refreshToken, req.ip, req.headers["user-agent"]]
      );

      // Log activity
      await db.query(
        `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
         VALUES ($1, 'login', 'Google OAuth login', $2, $3)`,
        [req.user.id, req.ip, req.headers["user-agent"]]
      );

      // Set cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${process.env.CLIENT_URL}/login?token=${accessToken}`);
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  },

  // ── GET /api/v1/auth/profile ─────────────────
  async getProfile(req, res, next) {
    try {
      const { rows } = await db.query(
        `SELECT id, email, name, avatar_url, role, 
                age, weight_kg, height_cm, gender,
                unit_preference, timezone,
                is_active, is_verified, last_login_at,
                created_at, updated_at
         FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ user: rows[0] });
    } catch (err) {
      next(err);
    }
  },

  // ── POST /api/v1/auth/logout ─────────────────
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        await db.query(
          `UPDATE refresh_tokens SET is_revoked = true WHERE token = $1`,
          [refreshToken]
        );
      }

      if (req.user) {
        await db.query(
          `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
           VALUES ($1, 'logout', 'User logged out', $2, $3)`,
          [req.user.id, req.ip, req.headers["user-agent"]]
        );
      }

      res.clearCookie("refreshToken");
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  },

  // ── POST /api/v1/auth/refresh ────────────────
  async refreshToken(req, res, next) {
    try {
      const token = req.cookies?.refreshToken;

      if (!token) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      const { rows: tokenRows } = await db.query(
        `SELECT * FROM refresh_tokens 
         WHERE token = $1 AND is_revoked = false AND expires_at > NOW()`,
        [token]
      );

      if (!tokenRows[0]) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const decoded = jwt.verify(token, jwtConfig.refreshSecret);

      const { rows: userRows } = await db.query(
        `SELECT id, email, role FROM users WHERE id = $1 AND is_active = true`,
        [decoded.id]
      );

      if (!userRows[0]) {
        return res.status(401).json({ error: "User not found or inactive" });
      }

      const accessToken = jwt.sign(
        { id: userRows[0].id, email: userRows[0].email, role: userRows[0].role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      res.json({ accessToken });
    } catch (err) {
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid refresh token" });
      }
      next(err);
    }
  },
};

module.exports = authController;

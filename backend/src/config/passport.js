// src/config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./database");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || "User";
        const avatarUrl = profile.photos?.[0]?.value || null;

        // Check if user exists
        let { rows } = await db.query(
          `SELECT * FROM users WHERE google_id = $1`,
          [googleId]
        );

        if (rows[0]) {
          // Update last_login_at
          await db.query(
            `UPDATE users SET last_login_at = NOW(), avatar_url = $1 WHERE id = $2`,
            [avatarUrl, rows[0].id]
          );
          rows[0].last_login_at = new Date();
          rows[0].avatar_url = avatarUrl;
          return done(null, rows[0]);
        }

        // Check if email already exists (registered differently)
        ({ rows } = await db.query(`SELECT * FROM users WHERE email = $1`, [email]));

        if (rows[0]) {
          // Link Google account
          await db.query(
            `UPDATE users SET google_id = $1, avatar_url = $2, last_login_at = NOW() WHERE id = $3`,
            [googleId, avatarUrl, rows[0].id]
          );
          rows[0].google_id = googleId;
          rows[0].avatar_url = avatarUrl;
          return done(null, rows[0]);
        }

        // Create new user
        ({ rows } = await db.query(
          `INSERT INTO users (google_id, email, name, avatar_url, is_verified, last_login_at)
           VALUES ($1, $2, $3, $4, true, NOW())
           RETURNING *`,
          [googleId, email, name, avatarUrl]
        ));

        return done(null, rows[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;

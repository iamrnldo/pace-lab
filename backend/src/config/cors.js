// src/config/cors.js
// CLIENT_URL boleh berisi beberapa origin dipisah koma, mis:
// CLIENT_URL=https://app.example.com,https://deploy-preview--app.netlify.app
const configured = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function isAllowed(origin) {
  if (configured.includes("*")) return true;
  if (configured.includes(origin)) return true;

  // Izinkan subdomain/preview dari origin yang dikonfigurasi
  // (contoh: deploy-preview-123--sitenya.netlify.app)
  let o;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  return configured.some((allowed) => {
    try {
      const a = new URL(allowed);
      return (
        o.host === a.host || o.hostname.endsWith("." + a.hostname)
      );
    } catch {
      return false;
    }
  });
}

const corsOptions = {
  origin: (origin, cb) => {
    // Request tanpa origin (curl, server-to-server, health check)
    if (!origin) return cb(null, true);
    if (isAllowed(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = corsOptions;

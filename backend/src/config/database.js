// src/config/database.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

// ── Konfigurasi koneksi ─────────────────────────────────────────────
// Mendukung DATABASE_URL tunggal (Neon/Supabase/Railway) ATAU variabel
// DB_* terpisah. DATABASE_URL otomatis mengaktifkan SSL.
function buildBaseConfig() {
  if (process.env.DATABASE_URL) {
    const u = new URL(process.env.DATABASE_URL);
    return {
      host: u.hostname,
      port: Number(u.port) || 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: (u.pathname || "").replace(/^\//, "") || undefined,
      ssl:
        process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres123",
    database: undefined,
    ssl:
      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

const BASE_CONFIG = buildBaseConfig();
const DB_NAME =
  process.env.DB_NAME || BASE_CONFIG.database || "running_calculator";

const pool = new Pool({
  host: BASE_CONFIG.host,
  port: BASE_CONFIG.port,
  user: BASE_CONFIG.user,
  password: BASE_CONFIG.password,
  ssl: BASE_CONFIG.ssl,
  database: DB_NAME,
  max: IS_SERVERLESS ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Di serverless (Vercel) JANGAN process.exit — cukup log.
  if (!IS_SERVERLESS) process.exit(-1);
});

// ── Helpers ─────────────────────────────────────────────────────────
function findSqlFile(name) {
  const candidates = [
    // Salinan yang dibundle (Vercel, disiapkan scripts/prepare-db-sql.js)
    path.join(__dirname, "../db", name),
    // Layout monorepo saat jalan lokal (backend -> root/database)
    path.join(__dirname, "../../../database/schemas", name),
    path.join(__dirname, "../../../../database/schemas", name),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

// schema.sql berisi `CREATE DATABASE ...` yang tidak bisa dijalankan dari
// koneksi ke database itu sendiri — buang statement tersebut.
function sanitizeSchema(sql) {
  return sql.replace(/CREATE DATABASE[^;]*;/gi, "");
}

async function ensureDatabase() {
  // 1) Coba langsung ke DB target (umum di Neon/Supabase: DB sudah ada).
  try {
    await pool.query("SELECT 1");
    return;
  } catch (err) {
    if (err.code !== "3D000") throw err; // 3D000 = database does not exist
  }

  // 2) Buat database lewat koneksi admin ke `postgres`.
  const adminPool = new Pool({
    host: BASE_CONFIG.host,
    port: BASE_CONFIG.port,
    user: BASE_CONFIG.user,
    password: BASE_CONFIG.password,
    ssl: BASE_CONFIG.ssl,
    database: "postgres",
  });
  try {
    const { rows } = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );
    if (rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`✅ Database "${DB_NAME}" created`);
    }
  } finally {
    await adminPool.end();
  }

  await pool.query("SELECT 1");
}

async function initDatabase() {
  // Step 1: pastikan database ada
  await ensureDatabase();

  // Step 2: jalankan schema jika tabel belum ada
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public'`
    );

    if (rows.length === 0) {
      console.log("🔧 Running schema...");
      const schemaPath = findSqlFile("schema.sql");
      const seedPath = findSqlFile("seed.sql");

      if (schemaPath) {
        const schema = sanitizeSchema(fs.readFileSync(schemaPath, "utf8"));
        await pool.query(schema);
        console.log("✅ Schema applied");
      } else {
        console.warn("⚠️  schema.sql not found, using minimal schema");
        await createMinimalSchema();
      }

      if (seedPath) {
        const seed = fs.readFileSync(seedPath, "utf8");
        if (seed.trim()) {
          await pool.query(seed);
          console.log("✅ Seed data applied");
        }
      }
    } else {
      console.log("📊 Tables already exist");
    }
  } catch (err) {
    console.error("❌ Schema error:", err.message);
    try {
      await createMinimalSchema();
    } catch (fallbackErr) {
      console.error("❌ Fallback schema error:", fallbackErr.message);
    }
  }

  // Step 3: auto-migrate — pastikan kolom yang dibutuhkan ada
  await autoMigrate();

  // Step 4: seed admin
  await seedAdmin();
}

// Versi cached untuk serverless: hanya berjalan sekali per warm instance.
let initPromise = null;
function ensureDatabaseReady() {
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      initPromise = null; // biarkan request berikutnya retry
      throw err;
    });
  }
  return initPromise;
}

async function autoMigrate() {
  console.log("🔄 Checking migrations...");

  try {
    // Cek kolom yang mungkin belum ada di users
    const columnsToAdd = [
      { name: "password_hash", type: "VARCHAR(255)" },
      { name: "age", type: "SMALLINT" },
      { name: "weight_kg", type: "DECIMAL(5,2)" },
      { name: "height_cm", type: "DECIMAL(5,2)" },
      { name: "gender", type: "VARCHAR(10)" },
      { name: "max_heart_rate", type: "SMALLINT" },
      { name: "resting_hr", type: "SMALLINT" },
    ];

    for (const col of columnsToAdd) {
      const { rows } = await pool.query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'users' AND column_name = $1`,
        [col.name]
      );

      if (rows.length === 0) {
        await pool.query(
          `ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`
        );
        console.log(`  ➕ Added column: ${col.name}`);
      }
    }

    // Pastikan tabel calculator_types ada
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE calculator_category AS ENUM (
          'pace', 'race_prediction', 'training_zone', 'vo2max', 'calorie', 'split', 'finish_time'
        );
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS calculator_types (
        id SMALLSERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category calculator_category NOT NULL DEFAULT 'pace',
        icon VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        sort_order SMALLINT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Pastikan tabel calculation_history ada
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calculation_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        calculator_type_id SMALLINT REFERENCES calculator_types(id),
        input_data JSONB,
        result_data JSONB,
        is_saved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_calc_history_user ON calculation_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_calc_history_type ON calculation_history(calculator_type_id);
    `);

    // Seed calculator_types jika kosong
    const { rows: typeCount } = await pool.query(
      `SELECT COUNT(*) FROM calculator_types`
    );
    if (parseInt(typeCount[0].count) === 0) {
      await pool.query(`
        INSERT INTO calculator_types (slug, name, description, category, icon, sort_order) VALUES
        ('vcr-calculator', 'VCR Calculator', 'Calculate VCR from timed tests', 'pace', '⚡', 1),
        ('race-predictor', 'Race Predictor', 'Predict finish time based on performance', 'race_prediction', '🏆', 2),
        ('training-zone', 'Training Zones', 'Calculate HR training zones', 'training_zone', '❤️', 3),
        ('vo2max-calculator', 'VO2 Max', 'Estimate aerobic capacity', 'vo2max', '🫁', 4),
        ('calorie-calculator', 'Calorie Calculator', 'Calculate calories burned', 'calorie', '🔥', 5),
        ('split-calculator', 'Split Calculator', 'Calculate race splits', 'split', '📊', 6),
        ('finish-time', 'Finish Time', 'Calculate finish time with pace', 'finish_time', '🏁', 7)
        ON CONFLICT (slug) DO NOTHING;
      `);
      console.log("  ✅ Calculator types seeded");
    }

    console.log("✅ Migrations complete");
  } catch (err) {
    console.warn("⚠️  Migration warning:", err.message);
  }
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@pacelab.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "PaceLab Admin";

  try {
    const { rows } = await pool.query(
      `SELECT id, password_hash FROM users WHERE email = $1`,
      [adminEmail]
    );

    if (rows.length === 0) {
      // Admin belum ada — buat baru
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await pool.query(
        `INSERT INTO users (email, name, password_hash, role, is_active, is_verified)
         VALUES ($1, $2, $3, 'admin', true, true)`,
        [adminEmail, adminName, passwordHash]
      );
      console.log(`✅ Admin created: ${adminEmail}`);
    } else if (!rows[0].password_hash) {
      // Admin ada tapi belum punya password — update
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      await pool.query(
        `UPDATE users SET password_hash = $1, role = 'admin', is_active = true WHERE email = $2`,
        [passwordHash, adminEmail]
      );
      console.log(`✅ Admin password set: ${adminEmail}`);
    } else {
      console.log(`👤 Admin exists: ${adminEmail}`);
    }
  } catch (err) {
    console.error("❌ Admin seed error:", err.message);
  }
}

async function createMinimalSchema() {
  console.log("🔧 Creating minimal schema...");
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'user');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN CREATE TYPE unit_preference AS ENUM ('metric', 'imperial');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE activity_action AS ENUM (
        'login', 'logout', 'calculation', 'profile_update',
        'goal_created', 'goal_completed', 'admin_action'
      );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      role user_role DEFAULT 'user' NOT NULL,
      age SMALLINT,
      weight_kg DECIMAL(5,2),
      height_cm DECIMAL(5,2),
      gender VARCHAR(10),
      max_heart_rate SMALLINT,
      resting_hr SMALLINT,
      unit_preference unit_preference DEFAULT 'metric',
      timezone VARCHAR(50) DEFAULT 'UTC',
      is_active BOOLEAN DEFAULT true,
      is_verified BOOLEAN DEFAULT false,
      last_login_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action activity_action NOT NULL,
      description TEXT,
      metadata JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      is_revoked BOOLEAN DEFAULT false,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
  `);
  console.log("✅ Minimal schema created");
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  initDatabase,
  ensureDatabaseReady,
};

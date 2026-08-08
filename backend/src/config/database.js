// src/config/database.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

// ── Konfigurasi koneksi ─────────────────────────────────────────────
function buildBaseConfig() {
  if (process.env.DATABASE_URL) {
    const u = new URL(process.env.DATABASE_URL);
    return {
      host: u.hostname,
      port: Number(u.port) || 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: (u.pathname || "").replace(/^\//, "") || undefined,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
    };
  }
  return {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres123",
    database: undefined,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  };
}

const BASE_CONFIG = buildBaseConfig();
const DB_NAME = process.env.DB_NAME || BASE_CONFIG.database || "running_calculator";

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
  if (!IS_SERVERLESS) process.exit(-1);
});

// ── Helpers ─────────────────────────────────────────────────────────
function findSqlFile(name) {
  const candidates = [
    path.join(__dirname, "../db", name),
    path.join(__dirname, "../../../database/schemas", name),
    path.join(__dirname, "../../../../database/schemas", name),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function sanitizeSchema(sql) {
  return sql.replace(/CREATE DATABASE[^;]*;/gi, "");
}

async function ensureDatabase() {
  try {
    await pool.query("SELECT 1");
    return;
  } catch (err) {
    if (err.code !== "3D000") throw err; 
  }

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
}

async function initDatabase() {
  await ensureDatabase();

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

  await autoMigrate();
  await seedAdmin();
}

async function autoMigrate() {
  console.log("🔄 Checking migrations...");

  try {
    // 1. Columns for users
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
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
    }

    // 2. calculator_types
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

    // 3. calculation_history
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
    `);

    // 4. training_programs (Penambahan Tabel Baru)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_programs (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        race_event      VARCHAR(50) NOT NULL,
        level           VARCHAR(20) NOT NULL,
        prep_months     SMALLINT NOT NULL,
        start_month     VARCHAR(20) NOT NULL,
        end_month       VARCHAR(20) NOT NULL,
        training_days   JSONB NOT NULL,
        program_data    JSONB NOT NULL,
        status          VARCHAR(20) DEFAULT 'active',
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_training_programs_user_id ON training_programs(user_id);
    `);

    // Seed calculator_types if empty
    const { rows: typeCount } = await pool.query(`SELECT COUNT(*) FROM calculator_types`);
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
    }

    console.log("✅ Migrations complete");
  } catch (err) {
    console.warn("⚠️  Migration error:", err.message);
  }
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@pacelab.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminName = process.env.ADMIN_NAME || "PaceLab Admin";

  try {
    const { rows } = await pool.query(`SELECT id, password_hash FROM users WHERE email = $1`, [adminEmail]);
    if (rows.length === 0) {
      const bcrypt = require("bcryptjs");
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await pool.query(
        `INSERT INTO users (email, name, password_hash, role, is_active, is_verified) VALUES ($1, $2, $3, 'admin', true, true)`,
        [adminEmail, adminName, passwordHash]
      );
    }
  } catch (err) {
    console.error("❌ Admin seed error:", err.message);
  }
}

async function createMinimalSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_id VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      role VARCHAR(20) DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  initDatabase,
};
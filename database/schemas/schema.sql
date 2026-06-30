-- ============================================
-- DATABASE: running_calculator
-- ============================================

CREATE DATABASE running_calculator
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8';

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For search functionality

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE unit_preference AS ENUM ('metric', 'imperial');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'cancelled', 'paused');
CREATE TYPE goal_type AS ENUM (
    'finish_time',
    'pace_target', 
    'distance_target',
    'race_event'
);
CREATE TYPE calculator_category AS ENUM (
    'pace',
    'race_prediction',
    'training_zone',
    'vo2max',
    'calorie',
    'split',
    'finish_time'
);
CREATE TYPE activity_action AS ENUM (
    'login',
    'logout',
    'calculation',
    'profile_update',
    'goal_created',
    'goal_completed',
    'admin_action'
);

-- ============================================
-- TABLE: users
-- ============================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id       VARCHAR(255) UNIQUE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    avatar_url      TEXT,
    role            user_role DEFAULT 'user' NOT NULL,
    
    -- Runner Profile
    age             SMALLINT CHECK (age > 0 AND age < 120),
    weight_kg       DECIMAL(5,2) CHECK (weight_kg > 0),
    height_cm       DECIMAL(5,2) CHECK (height_cm > 0),
    gender          VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    max_heart_rate  SMALLINT CHECK (max_heart_rate > 0 AND max_heart_rate < 250),
    resting_hr      SMALLINT CHECK (resting_hr > 0 AND resting_hr < 200),
    
    -- Preferences
    unit_preference unit_preference DEFAULT 'metric',
    timezone        VARCHAR(50) DEFAULT 'UTC',
    
    -- Account Status
    is_active       BOOLEAN DEFAULT true,
    is_verified     BOOLEAN DEFAULT false,
    last_login_at   TIMESTAMPTZ,
    
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- TABLE: calculator_types
-- ============================================

CREATE TABLE calculator_types (
    id          SMALLSERIAL PRIMARY KEY,
    slug        VARCHAR(50) UNIQUE NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    category    calculator_category NOT NULL,
    icon        VARCHAR(50),
    is_active   BOOLEAN DEFAULT true,
    sort_order  SMALLINT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Calculator Types
INSERT INTO calculator_types (slug, name, description, category, icon, sort_order) 
VALUES
    ('pace-calculator',    'Pace Calculator',         'Calculate your running pace per km/mile',              'pace',             '⚡', 1),
    ('race-predictor',     'Race Time Predictor',     'Predict finish time based on recent performance',      'race_prediction',  '🏆', 2),
    ('training-zone',      'Training Zone Calculator','Calculate HR training zones',                          'training_zone',    '❤️', 3),
    ('vo2max-calculator',  'VO2 Max Calculator',      'Estimate your aerobic capacity',                       'vo2max',           '🫁', 4),
    ('calorie-calculator', 'Calorie Calculator',      'Calculate calories burned during running',              'calorie',          '🔥', 5),
    ('split-calculator',   'Split Calculator',        'Calculate even/negative splits for your race',         'split',            '📊', 6),
    ('finish-time',        'Finish Time Calculator',  'Calculate estimated finish time with pace',            'finish_time',      '🏁', 7);

-- ============================================
-- TABLE: calculation_history
-- ============================================

CREATE TABLE calculation_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    calculator_type_id  SMALLINT REFERENCES calculator_types(id),
    
    -- Input Data (flexible JSON for different calculators)
    input_data          JSONB NOT NULL,
    
    -- Output/Result Data
    result_data         JSONB NOT NULL,
    
    -- Meta
    is_saved            BOOLEAN DEFAULT false,
    label               VARCHAR(100),        -- User custom label
    notes               TEXT,
    
    -- Session (for anonymous tracking)
    session_id          VARCHAR(100),
    ip_address          INET,
    
    -- Timestamps
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for calculation_history
CREATE INDEX idx_calc_history_user_id ON calculation_history(user_id);
CREATE INDEX idx_calc_history_type ON calculation_history(calculator_type_id);
CREATE INDEX idx_calc_history_created_at ON calculation_history(created_at DESC);
CREATE INDEX idx_calc_history_user_saved ON calculation_history(user_id, is_saved);
CREATE INDEX idx_calc_history_input ON calculation_history USING GIN(input_data);
CREATE INDEX idx_calc_history_result ON calculation_history USING GIN(result_data);

-- ============================================
-- TABLE: user_goals
-- ============================================

CREATE TABLE user_goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Goal Details
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    type            goal_type NOT NULL,
    status          goal_status DEFAULT 'active',
    
    -- Target
    target_race     VARCHAR(100),            -- e.g., "Jakarta Marathon 2025"
    target_distance DECIMAL(8,3),            -- in kilometers
    target_time     INTEGER,                 -- in seconds
    target_pace     DECIMAL(6,2),            -- seconds per km
    target_date     DATE,
    
    -- Current Progress
    current_best    INTEGER,                 -- in seconds
    progress_pct    DECIMAL(5,2) DEFAULT 0,
    
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- Indexes for user_goals
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(status);
CREATE INDEX idx_user_goals_target_date ON user_goals(target_date);
CREATE INDEX idx_user_goals_user_status ON user_goals(user_id, status);

-- ============================================
-- TABLE: activity_logs
-- ============================================

CREATE TABLE activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action      activity_action NOT NULL,
    description TEXT,
    metadata    JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action);

-- Partition by month for large datasets (optional)
-- CREATE TABLE activity_logs_2025_01 PARTITION OF activity_logs
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ============================================
-- TABLE: refresh_tokens
-- ============================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN DEFAULT false,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for refresh_tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Apply trigger to user_goals
CREATE TRIGGER trigger_user_goals_updated_at
    BEFORE UPDATE ON user_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEWS
-- ============================================

-- User stats summary view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.created_at AS member_since,
    COUNT(DISTINCT ch.id) AS total_calculations,
    COUNT(DISTINCT CASE WHEN ch.is_saved THEN ch.id END) AS saved_calculations,
    COUNT(DISTINCT ug.id) AS total_goals,
    COUNT(DISTINCT CASE WHEN ug.status = 'completed' THEN ug.id END) AS completed_goals,
    MAX(ch.created_at) AS last_calculation_at,
    u.last_login_at
FROM users u
LEFT JOIN calculation_history ch ON ch.user_id = u.id
LEFT JOIN user_goals ug ON ug.user_id = u.id
GROUP BY u.id, u.name, u.email, u.role, u.created_at, u.last_login_at;

-- Calculator usage analytics view
CREATE OR REPLACE VIEW calculator_analytics AS
SELECT 
    ct.slug,
    ct.name,
    ct.category,
    COUNT(ch.id) AS total_uses,
    COUNT(DISTINCT ch.user_id) AS unique_users,
    COUNT(CASE WHEN ch.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS uses_last_7d,
    COUNT(CASE WHEN ch.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS uses_last_30d,
    MAX(ch.created_at) AS last_used_at
FROM calculator_types ct
LEFT JOIN calculation_history ch ON ch.calculator_type_id = ct.id
GROUP BY ct.id, ct.slug, ct.name, ct.category
ORDER BY total_uses DESC;

-- ============================================
-- SAMPLE INPUT/RESULT JSONB STRUCTURES
-- ============================================

/*
-- Pace Calculator Input:
{
    "distance_km": 10,
    "time_seconds": 3600,
    "unit": "metric"
}

-- Pace Calculator Result:
{
    "pace_per_km": "6:00",
    "pace_per_mile": "9:39",
    "speed_kmh": 10.0,
    "speed_mph": 6.21,
    "finish_time_5k": "0:30:00",
    "finish_time_10k": "1:00:00",
    "finish_time_half": "2:11:36",
    "finish_time_full": "4:23:12"
}

-- Race Predictor Input:
{
    "recent_distance_km": 10,
    "recent_time_seconds": 3000,
    "target_distance": "half_marathon"
}

-- Race Predictor Result:
{
    "predicted_time": "2:04:28",
    "predicted_pace": "5:54/km",
    "riegel_factor": 1.06,
    "splits": [...]
}

-- Training Zone Input:
{
    "max_heart_rate": 185,
    "resting_heart_rate": 60,
    "method": "karvonen"
}

-- Training Zone Result:
{
    "zones": [
        {"zone": 1, "name": "Recovery", "min_hr": 93, "max_hr": 111, "pct_range": "50-60%"},
        {"zone": 2, "name": "Aerobic", "min_hr": 111, "max_hr": 130, "pct_range": "60-70%"},
        {"zone": 3, "name": "Tempo", "min_hr": 130, "max_hr": 148, "pct_range": "70-80%"},
        {"zone": 4, "name": "Threshold", "min_hr": 148, "max_hr": 167, "pct_range": "80-90%"},
        {"zone": 5, "name": "VO2 Max", "min_hr": 167, "max_hr": 185, "pct_range": "90-100%"}
    ]
}
*/
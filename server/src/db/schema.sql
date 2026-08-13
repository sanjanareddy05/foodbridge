-- ============================================================
-- FoodBridge Database Schema
-- PostgreSQL 15+
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for geo queries

-- ─── ENUMS ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('ngo', 'restaurant', 'volunteer', 'admin');
CREATE TYPE listing_status AS ENUM ('available', 'in_transit', 'delivered', 'expired', 'cancelled');
CREATE TYPE food_type AS ENUM (
  'cooked_meals', 'bakery', 'raw_produce',
  'dairy', 'catering_event', 'packaged_food'
);
CREATE TYPE storage_condition AS ENUM (
  'room_temperature', 'refrigerated', 'hot_heated', 'frozen'
);
CREATE TYPE vehicle_type AS ENUM ('car', 'scooter', 'bicycle', 'van');
CREATE TYPE notif_type AS ENUM ('urgent', 'tracking', 'success', 'info', 'system');
CREATE TYPE pickup_step AS ENUM (
  'listed', 'accepted', 'assigned', 'en_route', 'qr_verified', 'delivered'
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL,
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  avatar_url    TEXT,
  is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users(email);
CREATE INDEX idx_users_role   ON users(role);

-- ─── REFRESH TOKENS ──────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ─── ORGANISATIONS (NGOs + Restaurants) ──────────────────────────────────────
CREATE TABLE organisations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  org_type      VARCHAR(50)  NOT NULL,   -- 'ngo' | 'restaurant' | 'hotel' | 'caterer'
  address       TEXT         NOT NULL,
  city          VARCHAR(100) NOT NULL,
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  capacity      INTEGER,                 -- for NGOs: daily meal capacity
  fssai_number  VARCHAR(50),             -- food safety license
  is_verified   BOOLEAN      NOT NULL DEFAULT FALSE,
  verified_at   TIMESTAMPTZ,
  meals_received INTEGER     NOT NULL DEFAULT 0,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_org_user  ON organisations(user_id);
CREATE INDEX idx_org_type  ON organisations(org_type);
CREATE INDEX idx_org_city  ON organisations(city);

-- ─── VOLUNTEER PROFILES ───────────────────────────────────────────────────────
CREATE TABLE volunteer_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  vehicle         vehicle_type NOT NULL,
  vehicle_details VARCHAR(100),          -- e.g. "Honda Activa MH-XX-1234"
  rating          DECIMAL(3,2) NOT NULL DEFAULT 5.00,
  total_deliveries INTEGER     NOT NULL DEFAULT 0,
  kg_delivered    DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available    BOOLEAN      NOT NULL DEFAULT TRUE,
  last_location_lat  DECIMAL(10,8),
  last_location_lng  DECIMAL(11,8),
  last_location_at   TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volunteer_user      ON volunteer_profiles(user_id);
CREATE INDEX idx_volunteer_available ON volunteer_profiles(is_available);

-- ─── FOOD LISTINGS ────────────────────────────────────────────────────────────
CREATE TABLE listings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id         UUID             NOT NULL REFERENCES organisations(id),
  name             VARCHAR(255)     NOT NULL,
  food_type        food_type        NOT NULL,
  quantity         DECIMAL(10,2)    NOT NULL,
  unit             VARCHAR(20)      NOT NULL DEFAULT 'kg',
  storage          storage_condition NOT NULL,
  allergens        TEXT[],
  notes            TEXT,
  images           TEXT[],
  prepared_at      TIMESTAMPTZ,
  pickup_deadline  TIMESTAMPTZ      NOT NULL,
  pickup_lat       DECIMAL(10,8)    NOT NULL,
  pickup_lng       DECIMAL(11,8)    NOT NULL,
  pickup_address   TEXT             NOT NULL,
  spoilage_risk    INTEGER          NOT NULL DEFAULT 0 CHECK (spoilage_risk BETWEEN 0 AND 100),
  ai_confidence    DECIMAL(4,2),
  status           listing_status   NOT NULL DEFAULT 'available',
  assigned_ngo_id  UUID             REFERENCES organisations(id),
  accepted_at      TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  qr_code          VARCHAR(50)      UNIQUE,
  qr_verified_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_status   ON listings(status);
CREATE INDEX idx_listings_donor    ON listings(donor_id);
CREATE INDEX idx_listings_ngo      ON listings(assigned_ngo_id);
CREATE INDEX idx_listings_deadline ON listings(pickup_deadline);
CREATE INDEX idx_listings_location ON listings(pickup_lat, pickup_lng);

-- Partial index for active listings (most common query)
CREATE INDEX idx_listings_available ON listings(created_at DESC)
  WHERE status = 'available';

-- ─── PICKUPS ─────────────────────────────────────────────────────────────────
-- Tracks the full lifecycle of each food handoff
CREATE TABLE pickups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID         NOT NULL REFERENCES listings(id),
  volunteer_id    UUID         NOT NULL REFERENCES volunteer_profiles(id),
  ngo_id          UUID         NOT NULL REFERENCES organisations(id),
  current_step    pickup_step  NOT NULL DEFAULT 'accepted',
  route_data      JSONB,       -- { distanceKm, etaMin, polyline, steps }
  departed_at     TIMESTAMPTZ,
  arrived_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  volunteer_notes TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pickups_listing   ON pickups(listing_id);
CREATE INDEX idx_pickups_volunteer ON pickups(volunteer_id);
CREATE INDEX idx_pickups_ngo       ON pickups(ngo_id);

-- ─── PICKUP EVENTS (audit trail) ─────────────────────────────────────────────
CREATE TABLE pickup_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_id  UUID        NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  step       pickup_step NOT NULL,
  actor_id   UUID        REFERENCES users(id),
  metadata   JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_pickup ON pickup_events(pickup_id);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        notif_type  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  listing_id  UUID        REFERENCES listings(id) ON DELETE SET NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user    ON notifications(user_id, is_read);
CREATE INDEX idx_notifs_created ON notifications(created_at DESC);

-- ─── VOLUNTEER RATINGS ────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_id    UUID        NOT NULL REFERENCES pickups(id) UNIQUE,
  rater_id     UUID        NOT NULL REFERENCES users(id),
  volunteer_id UUID        NOT NULL REFERENCES volunteer_profiles(id),
  score        SMALLINT    NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ratings_volunteer ON ratings(volunteer_id);

-- ─── IMPACT METRICS (materialised daily) ─────────────────────────────────────
CREATE TABLE daily_impact (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date             DATE        NOT NULL UNIQUE,
  meals_rescued    INTEGER     NOT NULL DEFAULT 0,
  kg_rescued       DECIMAL(10,2) NOT NULL DEFAULT 0,
  co2_prevented_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  deliveries_count INTEGER     NOT NULL DEFAULT 0,
  volunteers_count INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_daily_impact_date ON daily_impact(date DESC);

-- ─── FUNCTIONS & TRIGGERS ─────────────────────────────────────────────────────
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at         BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organisations_updated_at BEFORE UPDATE ON organisations  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_volunteers_updated_at    BEFORE UPDATE ON volunteer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_listings_updated_at      BEFORE UPDATE ON listings       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pickups_updated_at       BEFORE UPDATE ON pickups        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update volunteer rating after new rating inserted
CREATE OR REPLACE FUNCTION refresh_volunteer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE volunteer_profiles
  SET rating = (SELECT ROUND(AVG(score)::NUMERIC, 2) FROM ratings WHERE volunteer_id = NEW.volunteer_id)
  WHERE id = NEW.volunteer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_rating
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION refresh_volunteer_rating();

-- ─── VIEWS ────────────────────────────────────────────────────────────────────
CREATE VIEW v_active_listings AS
  SELECT
    l.*,
    o.name  AS donor_name,
    o.city  AS city,
    o.lat   AS donor_lat,
    o.lng   AS donor_lng
  FROM listings l
  JOIN organisations o ON o.id = l.donor_id
  WHERE l.status = 'available'
    AND l.pickup_deadline > NOW()
  ORDER BY l.spoilage_risk DESC, l.pickup_deadline ASC;

CREATE VIEW v_pickup_summary AS
  SELECT
    p.id,
    p.listing_id,
    l.name        AS food_name,
    l.quantity,
    l.unit,
    l.status      AS listing_status,
    p.current_step,
    u.name        AS volunteer_name,
    o.name        AS ngo_name,
    p.created_at  AS accepted_at,
    p.delivered_at
  FROM pickups p
  JOIN listings l             ON l.id = p.listing_id
  JOIN volunteer_profiles vp  ON vp.id = p.volunteer_id
  JOIN users u                ON u.id = vp.user_id
  JOIN organisations o        ON o.id = p.ngo_id;

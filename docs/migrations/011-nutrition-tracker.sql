-- Nutrition Tracker Tables
-- Run this in Supabase Dashboard SQL Editor

-- 1. Food catalog (~120 items, pre-seeded separately)
CREATE TABLE nutrition_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍽️',
  image_url TEXT,
  meal_categories TEXT[] NOT NULL DEFAULT '{}',
  protein_score INT NOT NULL DEFAULT 0 CHECK (protein_score BETWEEN 0 AND 3),
  veggie_score INT NOT NULL DEFAULT 0 CHECK (veggie_score BETWEEN 0 AND 3),
  sugar_score INT NOT NULL DEFAULT 0 CHECK (sugar_score BETWEEN 0 AND 3),
  water_score INT NOT NULL DEFAULT 0 CHECK (water_score BETWEEN 0 AND 3),
  vitamin_score INT NOT NULL DEFAULT 0 CHECK (vitamin_score BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_foods_meal_categories ON nutrition_foods USING GIN (meal_categories);

ALTER TABLE nutrition_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON nutrition_foods
  FOR ALL USING (true) WITH CHECK (true);

-- 2. One row per food item logged
CREATE TABLE nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES nutrition_foods(id) ON DELETE CASCADE,
  meal_category TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_logs_member_logged ON nutrition_logs (member_id, logged_at DESC);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON nutrition_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Computed daily summary (composite PK)
CREATE TABLE nutrition_daily_state (
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  protein_total INT NOT NULL DEFAULT 0,
  veggie_total INT NOT NULL DEFAULT 0,
  sugar_total INT NOT NULL DEFAULT 0,
  water_total INT NOT NULL DEFAULT 0,
  vitamin_total INT NOT NULL DEFAULT 0,
  avatar_state TEXT NOT NULL DEFAULT 'pebble',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, date)
);

ALTER TABLE nutrition_daily_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON nutrition_daily_state
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Separate water tracking
CREATE TABLE nutrition_water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nutrition_water_logs_member_logged ON nutrition_water_logs (member_id, logged_at DESC);

ALTER TABLE nutrition_water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON nutrition_water_logs
  FOR ALL USING (true) WITH CHECK (true);

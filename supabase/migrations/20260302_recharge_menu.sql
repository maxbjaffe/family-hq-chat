-- Kids Recharge Menu — schema migration
-- Run this in Supabase Dashboard SQL Editor
-- Creates 3 tables: recharge_breaks, recharge_profiles, recharge_sessions

-- ============================================================
-- 1. recharge_breaks — Foundation + custom breaks
-- ============================================================
CREATE TABLE recharge_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('energy', 'calm', 'creative', 'fun')),
  duration integer NOT NULL CHECK (duration IN (5, 10, 15, 30)),
  name text NOT NULL,
  emoji text NOT NULL,
  description text,
  is_foundation boolean DEFAULT false,
  is_active boolean DEFAULT true,
  source text NOT NULL CHECK (source IN ('foundation', 'survey', 'parent_added')),
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recharge_breaks_child_id ON recharge_breaks(child_id);
CREATE INDEX idx_recharge_breaks_is_foundation ON recharge_breaks(is_foundation);
CREATE INDEX idx_recharge_breaks_duration ON recharge_breaks(duration);

-- ============================================================
-- 2. recharge_profiles — Per-child survey responses
-- ============================================================
CREATE TABLE recharge_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL UNIQUE REFERENCES family_members(id) ON DELETE CASCADE,
  hype_song text,
  calm_strategy text,
  movement_preference text,
  creative_preference text,
  free_time_choice text,
  favorite_snack text,
  break_style text CHECK (break_style IN ('solo', 'sibling', 'pet', 'any')),
  never_suggest text[] DEFAULT '{}',
  victory_move text,
  custom_break_idea text,
  hidden_breaks uuid[] DEFAULT '{}',
  survey_completed boolean DEFAULT false,
  survey_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. recharge_sessions — Usage tracking
-- ============================================================
CREATE TABLE recharge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  break_id uuid NOT NULL REFERENCES recharge_breaks(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  completed boolean DEFAULT false,
  paused_duration integer DEFAULT 0,
  duration_planned integer NOT NULL,
  duration_actual integer,
  context text CHECK (context IN ('homework', 'frustrated', 'celebration', 'low_energy', 'transition', 'manual')),
  rating integer CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_recharge_sessions_child_id ON recharge_sessions(child_id);
CREATE INDEX idx_recharge_sessions_break_id ON recharge_sessions(break_id);
CREATE INDEX idx_recharge_sessions_started_at ON recharge_sessions(started_at);

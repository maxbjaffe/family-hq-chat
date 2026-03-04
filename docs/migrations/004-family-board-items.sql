-- Family Board Items
-- Run this in Supabase Dashboard SQL Editor

CREATE TABLE family_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_family_board_items_created ON family_board_items(created_at DESC);

ALTER TABLE family_board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON family_board_items
  FOR ALL USING (true) WITH CHECK (true);

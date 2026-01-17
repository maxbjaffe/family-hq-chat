-- Comprehensive Fixes Migration
-- Run in Supabase SQL Editor

-- 1. Profile visibility column for family_members
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS profile_visibility JSONB DEFAULT '{
  "birthday": true,
  "age": true,
  "bloodType": true,
  "allergies": true,
  "medications": true,
  "conditions": true,
  "emergencyNotes": true,
  "doctors": true,
  "patientPortal": true,
  "school": true,
  "teachers": true,
  "activities": true
}'::jsonb;

-- 2. Day-of-week selection column for checklist_items
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS active_days TEXT DEFAULT '["mon","tue","wed","thu","fri"]';

-- 3. Migrate existing weekdays_only data to active_days
UPDATE checklist_items
SET active_days = CASE
  WHEN weekdays_only = true THEN '["mon","tue","wed","thu","fri"]'
  WHEN weekdays_only = false THEN '["mon","tue","wed","thu","fri","sat","sun"]'
  ELSE '["mon","tue","wed","thu","fri"]'
END
WHERE active_days = '["mon","tue","wed","thu","fri"]' OR active_days IS NULL;

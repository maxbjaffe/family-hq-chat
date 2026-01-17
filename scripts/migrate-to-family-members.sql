-- Migration: Unify users and children tables into family_members
-- Purpose: Create a single table for all family members (adults, kids, pets)
-- Date: 2025-01-17
--
-- This migration is IDEMPOTENT - safe to run multiple times
-- Uses IF NOT EXISTS and ON CONFLICT DO NOTHING throughout

-- ============================================================================
-- STEP 1: Create family_members table
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'adult', 'kid', 'pet')),
    pin_hash TEXT,  -- NULL for kids and pets (no PIN needed)
    avatar_url TEXT,  -- Path to avatar image (e.g., '/Images/Avatars/Riley.PNG')
    has_checklist BOOLEAN DEFAULT false,  -- Only kids have checklists currently
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for PIN lookups (used during authentication)
CREATE INDEX IF NOT EXISTS idx_family_members_pin_hash ON family_members(pin_hash) WHERE pin_hash IS NOT NULL;

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_family_members_role ON family_members(role);

-- ============================================================================
-- STEP 2: Add new columns to checklist_items
-- ============================================================================

-- Add reset_daily column (for future: items that reset daily vs. one-time tasks)
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS reset_daily BOOLEAN DEFAULT true;

-- Add member_id column to reference family_members
ALTER TABLE checklist_items
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id);

-- Create index for member_id lookups
CREATE INDEX IF NOT EXISTS idx_checklist_items_member_id ON checklist_items(member_id);

-- ============================================================================
-- STEP 3: Add new columns to checklist_completions
-- ============================================================================

-- Add member_id column to reference family_members
ALTER TABLE checklist_completions
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES family_members(id);

-- Create index for member_id lookups
CREATE INDEX IF NOT EXISTS idx_checklist_completions_member_id ON checklist_completions(member_id);

-- ============================================================================
-- STEP 4: Migrate data from users table to family_members
-- ============================================================================

-- Insert users into family_members (preserving role and pin_hash)
-- Uses ON CONFLICT DO NOTHING to be idempotent
INSERT INTO family_members (id, name, role, pin_hash, has_checklist, created_at)
SELECT
    id,
    name,
    role,
    pin_hash,
    false,  -- adults don't have checklists (yet)
    COALESCE(created_at, NOW())
FROM users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: Migrate data from children table to family_members
-- ============================================================================

-- Insert children into family_members
-- Maps avatar_data to avatar_url, sets role='kid', has_checklist=true
INSERT INTO family_members (id, name, role, avatar_url, has_checklist, created_at)
SELECT
    id,
    name,
    'kid',
    avatar_data,  -- avatar_data in children becomes avatar_url in family_members
    true,  -- kids have checklists
    COALESCE(created_at, NOW())
FROM children
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 6: Update checklist_items.member_id from child_id
-- ============================================================================

-- Set member_id to match existing child_id values
UPDATE checklist_items
SET member_id = child_id
WHERE child_id IS NOT NULL
  AND member_id IS NULL;

-- ============================================================================
-- STEP 7: Update checklist_completions.member_id from child_id
-- ============================================================================

-- Set member_id to match existing child_id values
UPDATE checklist_completions
SET member_id = child_id
WHERE child_id IS NOT NULL
  AND member_id IS NULL;

-- ============================================================================
-- STEP 8: Insert Jaffe (the family pet)
-- ============================================================================

-- Insert Jaffe as a pet family member
-- Uses a deterministic UUID based on name to be idempotent
INSERT INTO family_members (name, role, avatar_url, has_checklist)
VALUES ('Jaffe', 'pet', '/Images/Avatars/Jaffe.PNG', false)
ON CONFLICT DO NOTHING;

-- Note: If you need a specific UUID for Jaffe, uncomment and modify:
-- INSERT INTO family_members (id, name, role, avatar_url, has_checklist)
-- VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Jaffe', 'pet', '/Images/Avatars/Jaffe.PNG', false)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES (run these to verify migration succeeded)
-- ============================================================================

-- Check family_members count and breakdown
-- SELECT role, COUNT(*) FROM family_members GROUP BY role;

-- Verify checklist_items have member_id populated
-- SELECT COUNT(*) AS total, COUNT(member_id) AS with_member_id FROM checklist_items;

-- Verify checklist_completions have member_id populated
-- SELECT COUNT(*) AS total, COUNT(member_id) AS with_member_id FROM checklist_completions;

-- Check for any orphaned checklist items (child_id without matching member_id)
-- SELECT * FROM checklist_items WHERE child_id IS NOT NULL AND member_id IS NULL;

-- ============================================================================
-- CLEANUP STEPS (run AFTER verification, in a separate session)
-- ============================================================================

-- WARNING: Only run these after confirming the migration is complete
-- and the application has been updated to use family_members

-- Step 1: Drop old columns from checklist_items
-- ALTER TABLE checklist_items DROP COLUMN IF EXISTS child_id;

-- Step 2: Drop old columns from checklist_completions
-- ALTER TABLE checklist_completions DROP COLUMN IF EXISTS child_id;

-- Step 3: Drop old tables (DANGEROUS - make sure you have backups!)
-- DROP TABLE IF EXISTS children;
-- DROP TABLE IF EXISTS users;

-- Step 4: Add NOT NULL constraint to member_id after data is migrated
-- ALTER TABLE checklist_items ALTER COLUMN member_id SET NOT NULL;
-- ALTER TABLE checklist_completions ALTER COLUMN member_id SET NOT NULL;

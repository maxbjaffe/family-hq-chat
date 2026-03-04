-- Add completion_date column to checklist_completions
-- This column tracks which date a completion is for (for daily reset)

-- Add the completion_date column if it doesn't exist
ALTER TABLE checklist_completions
ADD COLUMN IF NOT EXISTS completion_date DATE DEFAULT CURRENT_DATE;

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_checklist_completions_date
ON checklist_completions(completion_date);

-- Create index for member + date lookups
CREATE INDEX IF NOT EXISTS idx_checklist_completions_member_date
ON checklist_completions(member_id, completion_date);

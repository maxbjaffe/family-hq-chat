-- Add icon_type column to family_board_items
-- Stores the logo type to display as thumbnail (e.g. 'lunch-menu', 'class-schedule')
ALTER TABLE family_board_items ADD COLUMN icon_type TEXT DEFAULT 'general-doc';
UPDATE family_board_items SET icon_type = 'general-doc' WHERE icon_type IS NULL;

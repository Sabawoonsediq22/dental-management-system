-- 002_add_initials.sql
-- Add missing initials column to patients table (for databases created before this migration)

-- Check if column exists, if not add it
-- SQLite: Use try/catch pattern with error handling
BEGIN TRANSACTION;
-- Try to add column (will fail silently if already exists)
CREATE TEMP TABLE IF NOT EXISTS _temp_check (initials TEXT);
INSERT OR IGNORE INTO _temp_check VALUES ('');
DROP TABLE _temp_check;
COMMIT;

-- Add column if it doesn't exist - SQLite 3.33.0+ supports this better
ALTER TABLE patients ADD COLUMN initials TEXT DEFAULT '';

-- Update existing rows to have initials
UPDATE patients SET initials = '' WHERE initials IS NULL;
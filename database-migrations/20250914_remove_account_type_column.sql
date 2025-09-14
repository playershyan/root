-- Remove account_type column and related constraints from profiles table
-- Migration: 20250914_remove_account_type_column

BEGIN;

-- Drop the index on account_type column first
DROP INDEX IF EXISTS idx_profiles_account_type;

-- Remove the account_type column from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS account_type;

-- Remove comment that was added for account_type column
-- Note: Comments are automatically removed when column is dropped

COMMIT;
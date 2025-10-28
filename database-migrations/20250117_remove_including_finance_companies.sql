-- Migration: Remove including_finance_companies column
-- Date: 2025-01-17
-- Description: Remove the including_finance_companies column as it's no longer used in the form

BEGIN;

-- Drop the column and its comment
ALTER TABLE public.listings DROP COLUMN IF EXISTS including_finance_companies;

COMMIT;

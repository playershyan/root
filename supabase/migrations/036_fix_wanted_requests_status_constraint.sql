-- Migration: Fix wanted_requests status CHECK constraint
-- Date: 2025-11-15
-- Purpose: Add 'pending' to the allowed status values for wanted_requests
--
-- ISSUE: The original CHECK constraint in migration 005 only allowed:
--   ('active', 'paused', 'deleted', 'fulfilled')
-- But the API code creates wanted requests with status='pending'
-- This causes a constraint violation preventing new wanted requests from being created.

-- ========================================
-- PART 1: Drop existing CHECK constraint
-- ========================================

-- Find and drop the existing CHECK constraint on wanted_requests.status
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'wanted_requests'
      AND con.contype = 'c'  -- CHECK constraint
      AND pg_get_constraintdef(con.oid) LIKE '%status%';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE wanted_requests DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped existing CHECK constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No existing CHECK constraint found on wanted_requests.status';
    END IF;
END $$;

-- ========================================
-- PART 2: Add new CHECK constraint with 'pending'
-- ========================================

-- Add the corrected CHECK constraint that includes 'pending'
ALTER TABLE wanted_requests 
ADD CONSTRAINT wanted_requests_status_check 
CHECK (status IN ('pending', 'active', 'paused', 'deleted', 'fulfilled'));

RAISE NOTICE 'Added new CHECK constraint with pending status included';

-- ========================================
-- PART 3: Update any existing records
-- ========================================

-- Update any records that might have invalid status
-- This shouldn't be necessary but is a safety measure
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM wanted_requests
    WHERE status NOT IN ('pending', 'active', 'paused', 'deleted', 'fulfilled');
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % wanted requests with invalid status values', invalid_count;
        -- Optionally, you could update them here:
        -- UPDATE wanted_requests SET status = 'pending' 
        -- WHERE status NOT IN ('pending', 'active', 'paused', 'deleted', 'fulfilled');
    ELSE
        RAISE NOTICE 'All existing wanted requests have valid status values';
    END IF;
END $$;

-- ========================================
-- PART 4: Verification
-- ========================================

-- Verify the new constraint is in place
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'wanted_requests'
          AND con.conname = 'wanted_requests_status_check'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Successfully created wanted_requests_status_check constraint';
    ELSE
        RAISE WARNING 'Failed to create wanted_requests_status_check constraint';
    END IF;
END $$;

-- Display the constraint definition for verification
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'wanted_requests'
  AND con.conname = 'wanted_requests_status_check';

-- ========================================
-- PART 5: Documentation
-- ========================================

COMMENT ON CONSTRAINT wanted_requests_status_check ON wanted_requests IS 
'Valid status values: pending (awaiting approval), active (approved and visible), paused (temporarily hidden), deleted (soft deleted), fulfilled (request closed/completed)';


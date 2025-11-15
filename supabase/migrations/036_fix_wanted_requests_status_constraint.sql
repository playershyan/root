-- Migration: Fix wanted_requests status CHECK constraint
-- Date: 2025-11-15
-- Purpose: Add 'pending' to the allowed status values for wanted_requests
--
-- ISSUE: The original CHECK constraint in migration 005 only allowed:
--   ('active', 'paused', 'deleted', 'fulfilled')
-- But the API code creates wanted requests with status='pending'
-- This causes a constraint violation preventing new wanted requests from being created.

-- ========================================
-- PART 1: Drop and recreate CHECK constraint
-- ========================================

DO $$
DECLARE
    constraint_name TEXT;
    constraint_def TEXT;
BEGIN
    -- Find existing CHECK constraint on status column
    SELECT con.conname, pg_get_constraintdef(con.oid)
    INTO constraint_name, constraint_def
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'wanted_requests'
      AND con.contype = 'c'  -- CHECK constraint
      AND pg_get_constraintdef(con.oid) LIKE '%status%';
    
    -- Check if constraint already has 'pending'
    IF constraint_def IS NOT NULL AND constraint_def LIKE '%pending%' THEN
        RAISE NOTICE 'CHECK constraint already includes pending status: %', constraint_name;
    ELSIF constraint_name IS NOT NULL THEN
        -- Drop old constraint and create new one
        EXECUTE format('ALTER TABLE wanted_requests DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped old CHECK constraint: %', constraint_name;
        
        ALTER TABLE wanted_requests 
        ADD CONSTRAINT wanted_requests_status_check 
        CHECK (status IN ('pending', 'active', 'paused', 'deleted', 'fulfilled'));
        
        RAISE NOTICE 'Created new CHECK constraint with pending status included';
    ELSE
        -- No constraint exists, create new one
        ALTER TABLE wanted_requests 
        ADD CONSTRAINT wanted_requests_status_check 
        CHECK (status IN ('pending', 'active', 'paused', 'deleted', 'fulfilled'));
        
        RAISE NOTICE 'Created CHECK constraint with pending status';
    END IF;
END $$;

-- ========================================
-- PART 2: Verify all existing records have valid status
-- ========================================

DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM wanted_requests
    WHERE status IS NOT NULL 
      AND status NOT IN ('pending', 'active', 'paused', 'deleted', 'fulfilled');
    
    IF invalid_count > 0 THEN
        RAISE WARNING 'Found % wanted requests with invalid status values', invalid_count;
    ELSE
        RAISE NOTICE 'All existing wanted requests have valid status values';
    END IF;
END $$;

-- ========================================
-- PART 3: Verification
-- ========================================

DO $$
DECLARE
    constraint_exists BOOLEAN;
    constraint_def TEXT;
BEGIN
    SELECT 
        EXISTS (
            SELECT 1
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
            WHERE nsp.nspname = 'public'
              AND rel.relname = 'wanted_requests'
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) LIKE '%status%'
              AND pg_get_constraintdef(con.oid) LIKE '%pending%'
        ),
        (
            SELECT pg_get_constraintdef(con.oid)
            FROM pg_constraint con
            INNER JOIN pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
            WHERE nsp.nspname = 'public'
              AND rel.relname = 'wanted_requests'
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) LIKE '%status%'
            LIMIT 1
        )
    INTO constraint_exists, constraint_def;
    
    IF constraint_exists THEN
        RAISE NOTICE 'SUCCESS: CHECK constraint includes pending status';
        RAISE NOTICE 'Constraint definition: %', constraint_def;
    ELSE
        RAISE WARNING 'FAILED: CHECK constraint does not include pending status';
    END IF;
END $$;

-- ========================================
-- PART 4: Documentation
-- ========================================

-- Add comment to document the constraint
COMMENT ON CONSTRAINT wanted_requests_status_check ON wanted_requests IS 
'Valid status values: pending (awaiting approval), active (approved and visible), paused (temporarily hidden), deleted (soft deleted), fulfilled (request closed/completed)';

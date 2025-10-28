-- Migration: Fix Listings INSERT RLS Policy
-- Date: 2025-10-28
-- Issue: FOR INSERT policies must use WITH CHECK, not USING clause
-- Impact: CRITICAL - Currently blocks all listing creation attempts
--
-- Root Cause: Previous migrations incorrectly used USING clause for INSERT policy
-- The USING clause applies to SELECT/UPDATE/DELETE (existing rows)
-- The WITH CHECK clause applies to INSERT (new rows being created)
--
-- Files with incorrect syntax:
-- - database-migrations/008_performance_advisor_completion.sql:29-30
-- - database-migrations/008_performance_advisor_completion_fixed.sql:29-30
-- - database-migrations/009_final_performance_completion.sql:49-50

DO $$
DECLARE
    policy_exists BOOLEAN;
    policy_cmd TEXT;
    policy_qual TEXT;
    policy_with_check TEXT;
BEGIN
    RAISE NOTICE '=== FIXING LISTINGS INSERT RLS POLICY ===';
    RAISE NOTICE 'Timestamp: %', NOW();

    -- Check current policy state
    SELECT EXISTS(
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'listings'
          AND policyname = 'Users can insert own listings'
    ) INTO policy_exists;

    IF policy_exists THEN
        -- Log current policy details for debugging
        SELECT cmd, qual, with_check INTO policy_cmd, policy_qual, policy_with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'listings'
          AND policyname = 'Users can insert own listings';

        RAISE NOTICE 'Found existing policy:';
        RAISE NOTICE '  Command: %', policy_cmd;
        RAISE NOTICE '  USING clause (qual): %', policy_qual;
        RAISE NOTICE '  WITH CHECK clause: %', policy_with_check;

        -- Drop the broken policy
        DROP POLICY "Users can insert own listings" ON public.listings;
        RAISE NOTICE 'Dropped broken INSERT policy';
    ELSE
        RAISE NOTICE 'No existing policy found - will create new one';
    END IF;

    -- Create correct policy with WITH CHECK clause
    -- This is the proper syntax for INSERT policies in PostgreSQL RLS
    CREATE POLICY "Users can insert own listings"
    ON public.listings
    FOR INSERT
    WITH CHECK (user_id = (SELECT auth.uid()));

    RAISE NOTICE 'Created correct INSERT policy with WITH CHECK clause';

    -- Verify policy was created correctly
    SELECT cmd, qual, with_check INTO policy_cmd, policy_qual, policy_with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listings'
      AND policyname = 'Users can insert own listings';

    RAISE NOTICE 'Verification - New policy details:';
    RAISE NOTICE '  Command: %', policy_cmd;
    RAISE NOTICE '  USING clause (qual): %', COALESCE(policy_qual, 'NULL - CORRECT for INSERT');
    RAISE NOTICE '  WITH CHECK clause: %', policy_with_check;

    -- Final validation
    IF policy_cmd = 'INSERT' AND policy_with_check IS NOT NULL THEN
        RAISE NOTICE '✓ Policy verification: SUCCESS - INSERT policy correctly uses WITH CHECK';
    ELSE
        RAISE WARNING '✗ Policy verification: FAILED - Check policy configuration manually';
    END IF;

    RAISE NOTICE '=== MIGRATION COMPLETE ===';

EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error during migration: %', SQLERRM;
    RAISE WARNING 'Stack trace: %', SQLSTATE;
    -- Re-raise to fail the migration
    RAISE;
END $$;

-- Additional verification query for manual checking
DO $$
BEGIN
    RAISE NOTICE 'Run this query to verify the fix:';
    RAISE NOTICE 'SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = ''listings'' AND cmd = ''INSERT'';';
END $$;

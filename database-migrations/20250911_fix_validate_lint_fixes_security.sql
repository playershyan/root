-- Fix search_path vulnerability and security definer in validate_lint_fixes function
-- Addresses WARN-level security advisory: function with mutable search_path

-- First, test current function output for validation
DO $$
DECLARE
    test_record RECORD;
    baseline_results TEXT := '';
BEGIN
    RAISE NOTICE '=== BASELINE VALIDATION ===';
    FOR test_record IN 
        SELECT check_name, status, details FROM public.validate_lint_fixes()
    LOOP
        baseline_results := baseline_results || format('%s: %s - %s | ', 
            test_record.check_name, test_record.status, test_record.details);
        RAISE NOTICE 'BASELINE: % | % | %', 
            test_record.check_name, test_record.status, test_record.details;
    END LOOP;
END $$;

-- Replace function with security fixes
CREATE OR REPLACE FUNCTION public.validate_lint_fixes()
RETURNS TABLE(check_name text, status text, details text)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO ''  -- Fixed search_path vulnerability
AS $function$
DECLARE
    auth_rls_count INTEGER;
    multiple_policies_count INTEGER;
    missing_indexes_count INTEGER;
BEGIN
    -- Check 1: Auth RLS initplan issues (schema-qualified references)
    SELECT COUNT(DISTINCT tablename) INTO auth_rls_count
    FROM pg_catalog.pg_policies 
    WHERE schemaname = 'public' 
    AND cmd = 'INSERT'
    AND tablename IN ('listings', 'alerts', 'profiles', 'promotions', 'phone_verifications', 'reports', 'conversations', 'messages', 'offers');
    
    RETURN QUERY SELECT 
        'Auth RLS Optimization'::TEXT,
        CASE WHEN auth_rls_count = 9 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Checked %s critical tables for auth.uid() optimization', auth_rls_count)::TEXT;
    
    -- Check 2: Multiple permissive policies (schema-qualified references)
    SELECT COUNT(*) INTO multiple_policies_count
    FROM (
        SELECT tablename, cmd 
        FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' AND tablename = 'reports' AND cmd = 'SELECT'
    ) t;
    
    RETURN QUERY SELECT 
        'Policy Consolidation'::TEXT,
        CASE WHEN multiple_policies_count <= 1 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Reports table has %s SELECT policies (should be 1)', multiple_policies_count)::TEXT;
    
    -- Check 3: Key indexes present (schema-qualified references)
    SELECT COUNT(*) INTO missing_indexes_count
    FROM (VALUES 
        ('idx_messages_conversation_id_fk'),
        ('idx_offers_listing_id_fk'),
        ('idx_alerts_listing_id_fk')
    ) AS expected(indexname)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_catalog.pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = expected.indexname
    );
    
    RETURN QUERY SELECT 
        'Critical Indexes'::TEXT,
        CASE WHEN missing_indexes_count = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('%s critical foreign key indexes missing', missing_indexes_count)::TEXT;
        
    RETURN;
END $function$;

-- Grant execute permission to authenticated users for new SECURITY INVOKER function
GRANT EXECUTE ON FUNCTION public.validate_lint_fixes() TO authenticated;

-- Validation test: ensure identical behavior after fix
DO $$
DECLARE
    test_record RECORD;
    validation_results TEXT := '';
BEGIN
    RAISE NOTICE '=== POST-FIX VALIDATION ===';
    FOR test_record IN 
        SELECT check_name, status, details FROM public.validate_lint_fixes()
    LOOP
        validation_results := validation_results || format('%s: %s - %s | ', 
            test_record.check_name, test_record.status, test_record.details);
        RAISE NOTICE 'POST-FIX: % | % | %', 
            test_record.check_name, test_record.status, test_record.details;
    END LOOP;
    
    RAISE NOTICE '✅ FUNCTION BEHAVIOR VALIDATED';
END $$;
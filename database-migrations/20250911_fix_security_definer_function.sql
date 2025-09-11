-- Fix Security Definer vulnerability in validate_performance_fixes function
-- Addresses ERROR-level security advisory: function with SECURITY DEFINER privilege escalation

-- Replace SECURITY DEFINER function with SECURITY INVOKER version
CREATE OR REPLACE FUNCTION public.validate_performance_fixes()
RETURNS TABLE(check_name text, status text, details text, recommendation text)
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    auth_rls_issues_count INTEGER;
    duplicate_policies_count INTEGER;
    unused_indexes_count INTEGER;
BEGIN
    -- Check 1: Auth RLS initplan issues
    SELECT COUNT(*) INTO auth_rls_issues_count
    FROM pg_policies pp
    JOIN pg_policy pol ON pol.polname = pp.policyname
    WHERE schemaname = 'public'
    AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%auth.uid()%'
    AND pg_get_expr(pol.polqual, pol.polrelid) NOT LIKE '%(select auth.uid())%';
    
    RETURN QUERY SELECT 
        'Auth RLS Performance'::TEXT,
        CASE 
            WHEN auth_rls_issues_count = 0 THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        format('%s policies with unoptimized auth calls', auth_rls_issues_count)::TEXT,
        CASE 
            WHEN auth_rls_issues_count > 0 THEN 'Wrap auth.uid() calls with (select auth.uid())'
            ELSE 'All auth calls properly optimized'
        END::TEXT;

    -- Check 2: Multiple permissive policies (simplified check)
    SELECT COUNT(*) INTO duplicate_policies_count
    FROM (
        SELECT schemaname, tablename, cmd, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename, cmd
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RETURN QUERY SELECT 
        'Duplicate RLS Policies'::TEXT,
        CASE 
            WHEN duplicate_policies_count = 0 THEN 'PASS'
            ELSE 'WARN'
        END::TEXT,
        format('%s table/action combinations with multiple policies', duplicate_policies_count)::TEXT,
        CASE 
            WHEN duplicate_policies_count > 0 THEN 'Consolidate duplicate permissive policies'
            ELSE 'All policies properly consolidated'
        END::TEXT;

    -- Check 3: Unused indexes (check if our target indexes still exist)
    SELECT COUNT(*) INTO unused_indexes_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
    AND indexname IN (
        'idx_user_sessions_expires_at', 'idx_messages_type', 'idx_business_profiles_user_id',
        'idx_business_profiles_is_active', 'idx_business_profiles_is_paused',
        'idx_wanted_requests_location', 'idx_profiles_phone_verified'
    );
    
    RETURN QUERY SELECT 
        'Index Optimization'::TEXT,
        CASE 
            WHEN unused_indexes_count = 0 THEN 'PASS'
            ELSE 'FAIL'
        END::TEXT,
        format('%s unused indexes still present', unused_indexes_count)::TEXT,
        CASE 
            WHEN unused_indexes_count > 0 THEN 'Remove unused indexes to improve performance'
            ELSE 'All unused indexes successfully removed'
        END::TEXT;
        
    RETURN;
END $function$;

-- Grant execute permission to authenticated users for new SECURITY INVOKER function
GRANT EXECUTE ON FUNCTION public.validate_performance_fixes() TO authenticated;

-- Ensure authenticated users can read the necessary system catalogs for function execution
-- Note: These permissions may already exist, but ensuring they're explicit for security clarity
GRANT SELECT ON pg_policies TO authenticated;
GRANT SELECT ON pg_policy TO authenticated;
GRANT SELECT ON pg_indexes TO authenticated;
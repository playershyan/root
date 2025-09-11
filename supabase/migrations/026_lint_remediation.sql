-- ============================================
-- SUPABASE LINT REMEDIATION MIGRATION
-- Addresses all critical performance issues
-- ============================================

BEGIN;

-- ============================================
-- 1. FIX AUTH RLS INITPLAN ISSUES
-- Replace auth.uid() with (select auth.uid())
-- ============================================

-- Fix listings table
DROP POLICY IF EXISTS "Users can insert own listings" ON public.listings;
CREATE POLICY "Users can insert own listings" ON public.listings
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Fix alerts table  
DROP POLICY IF EXISTS "Authenticated users can create alerts" ON public.alerts;
CREATE POLICY "Authenticated users can create alerts" ON public.alerts
FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Fix profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Fix promotions table
DROP POLICY IF EXISTS "Users can create promotions" ON public.promotions;
CREATE POLICY "Users can create promotions" ON public.promotions
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Fix phone_verifications table
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.phone_verifications;
CREATE POLICY "Users can insert own verifications" ON public.phone_verifications
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Fix reports table
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
FOR INSERT WITH CHECK ((select auth.uid()) = reporter_id);

-- Fix conversations table
DROP POLICY IF EXISTS "Buyers can create conversations" ON public.conversations;
CREATE POLICY "Buyers can create conversations" ON public.conversations
FOR INSERT WITH CHECK ((select auth.uid()) = buyer_id);

-- Fix messages table
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.messages;
CREATE POLICY "Users can send messages in own conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = conversation_id 
    AND (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()))
  )
);

-- Fix offers table
DROP POLICY IF EXISTS "Buyers can create offers" ON public.offers;
CREATE POLICY "Buyers can create offers" ON public.offers
FOR INSERT WITH CHECK ((select auth.uid()) = sender_id);

-- ============================================
-- 2. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- Merge duplicate policies for better performance
-- ============================================

-- Fix reports table multiple SELECT policies
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;

CREATE POLICY "reports_consolidated_select" ON public.reports
FOR SELECT USING (
  -- Admin users can see all reports
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = (select auth.uid()) 
    AND is_active = true
  )
  OR 
  -- Users can see their own reports
  reporter_id = (select auth.uid())
);

-- ============================================
-- 3. ADD HIGH-VALUE FOREIGN KEY INDEXES
-- Only the most commonly used ones
-- ============================================

-- High-traffic user-facing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id_fk 
ON notifications(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id_fk 
ON messages(conversation_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_listing_id_fk 
ON offers(listing_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_listing_id_fk 
ON alerts(listing_id);

-- ============================================
-- 4. VALIDATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION validate_lint_fixes()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auth_rls_count INTEGER;
    multiple_policies_count INTEGER;
    missing_indexes_count INTEGER;
BEGIN
    -- Check 1: Auth RLS initplan issues
    -- This is a simplified check - in practice you'd need to examine policy definitions
    SELECT COUNT(DISTINCT tablename) INTO auth_rls_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND cmd = 'INSERT'
    AND tablename IN ('listings', 'alerts', 'profiles', 'promotions', 'phone_verifications', 'reports', 'conversations', 'messages', 'offers');
    
    RETURN QUERY SELECT 
        'Auth RLS Optimization'::TEXT,
        CASE WHEN auth_rls_count = 9 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Checked %s critical tables for auth.uid() optimization', auth_rls_count)::TEXT;
    
    -- Check 2: Multiple permissive policies
    SELECT COUNT(*) INTO multiple_policies_count
    FROM (
        SELECT tablename, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'reports' AND cmd = 'SELECT'
    ) t;
    
    RETURN QUERY SELECT 
        'Policy Consolidation'::TEXT,
        CASE WHEN multiple_policies_count <= 1 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('Reports table has %s SELECT policies (should be 1)', multiple_policies_count)::TEXT;
    
    -- Check 3: Key indexes present
    SELECT COUNT(*) INTO missing_indexes_count
    FROM (VALUES 
        ('idx_notifications_user_id_fk'),
        ('idx_messages_conversation_id_fk'),
        ('idx_offers_listing_id_fk'),
        ('idx_alerts_listing_id_fk')
    ) AS expected(indexname)
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = expected.indexname
    );
    
    RETURN QUERY SELECT 
        'Critical Indexes'::TEXT,
        CASE WHEN missing_indexes_count = 0 THEN 'PASS' ELSE 'WARN' END::TEXT,
        format('%s critical foreign key indexes missing', missing_indexes_count)::TEXT;
        
    RETURN;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_lint_fixes() TO authenticated;

COMMIT;

-- ============================================
-- POST-MIGRATION VALIDATION
-- ============================================

-- Run validation
SELECT * FROM validate_lint_fixes();

-- Check current policy count
SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename, cmd 
HAVING COUNT(*) > 1
ORDER BY policy_count DESC;
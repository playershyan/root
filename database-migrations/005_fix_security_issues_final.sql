-- Migration: Fix Supabase Security Advisor Issues (FINAL - Safe Version)
-- Date: 2025-09-08
-- Description: Address security vulnerabilities identified by Supabase Security Advisor

-- ============================================
-- 1. Fix SECURITY DEFINER Views
-- ============================================

-- Convert views from SECURITY DEFINER to SECURITY INVOKER
-- This ensures views use the permissions of the querying user, not the view creator

-- Fix deletion_safety_status view (using correct column names)
DROP VIEW IF EXISTS public.deletion_safety_status CASCADE;
CREATE OR REPLACE VIEW public.deletion_safety_status
WITH (security_invoker = true)
AS
SELECT 
    dsc.id,
    dsc.enable_safety_checks as enabled,
    dsc.min_delete_age_days as grace_period_days,
    dsc.last_updated as created_at,
    dsc.last_updated as updated_at,
    (SELECT COUNT(*) FROM deletion_approval_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM deletion_backups WHERE backup_created_at > NOW() - INTERVAL '30 days') as recent_backups
FROM deletion_safety_config dsc
WHERE dsc.id = 1;

-- Fix user_session_dashboard view (using correct column names)
DROP VIEW IF EXISTS public.user_session_dashboard CASCADE;
CREATE OR REPLACE VIEW public.user_session_dashboard
WITH (security_invoker = true)
AS
SELECT 
    us.id,
    us.user_id,
    us.session_token,
    us.ip_address,
    us.user_agent,
    us.created_at,
    us.last_activity,
    us.expires_at,
    us.is_active,
    p.email,
    p.name as display_name
FROM user_sessions us
LEFT JOIN profiles p ON us.user_id = p.id;

-- Fix pending_permanent_deletion view (using correct column names)
DROP VIEW IF EXISTS public.pending_permanent_deletion CASCADE;
CREATE OR REPLACE VIEW public.pending_permanent_deletion
WITH (security_invoker = true)
AS
SELECT 
    'listing' as item_type,
    id as item_id,
    title as item_title,
    deleted_at,
    deleted_at + INTERVAL '30 days' as permanent_deletion_date
FROM listings
WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '25 days'
    AND NOT permanently_deleted
UNION ALL
SELECT 
    'wanted_request' as item_type,
    id as item_id,
    title as item_title,
    deleted_at,
    deleted_at + INTERVAL '30 days' as permanent_deletion_date
FROM wanted_requests
WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '25 days'
    AND NOT permanently_deleted;

-- ============================================
-- 2. Enable RLS on Tables (Safe - Only if not already enabled)
-- ============================================

-- Enable RLS on deletion_safety_config (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deletion_safety_config' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.deletion_safety_config ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on deletion_approval_requests (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deletion_approval_requests' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.deletion_approval_requests ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on deletion_backups (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deletion_backups' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.deletion_backups ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on admin_users (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'admin_users' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on deletion_logs (if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'deletion_logs' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- 3. Create RLS Policies (Safe - Drop and Recreate)
-- ============================================

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admin users can view deletion_safety_config" ON deletion_safety_config;
DROP POLICY IF EXISTS "Admin users can update deletion_safety_config" ON deletion_safety_config;
DROP POLICY IF EXISTS "Admin users can view deletion_approval_requests" ON deletion_approval_requests;
DROP POLICY IF EXISTS "Admin users can insert deletion_approval_requests" ON deletion_approval_requests;
DROP POLICY IF EXISTS "Admin users can update deletion_approval_requests" ON deletion_approval_requests;
DROP POLICY IF EXISTS "Admin users can manage deletion_approval_requests" ON deletion_approval_requests;
DROP POLICY IF EXISTS "Admin users can view deletion_backups" ON deletion_backups;
DROP POLICY IF EXISTS "System can insert deletion_backups" ON deletion_backups;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admin can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admin can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admin can delete admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view deletion_logs" ON deletion_logs;
DROP POLICY IF EXISTS "System can insert deletion_logs" ON deletion_logs;

-- Recreate policies
-- Policies for deletion_safety_config (admin only)
CREATE POLICY "Admin users can view deletion_safety_config" 
    ON deletion_safety_config FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admin users can update deletion_safety_config" 
    ON deletion_safety_config FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'admin'
        )
    );

-- Policies for deletion_approval_requests (admin only)
CREATE POLICY "Admin users can manage deletion_approval_requests" 
    ON deletion_approval_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Policies for deletion_backups (admin only)
CREATE POLICY "Admin users can view deletion_backups" 
    ON deletion_backups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "System can insert deletion_backups" 
    ON deletion_backups FOR INSERT
    WITH CHECK (true); -- Allow system functions to insert

-- Policies for admin_users (admin management)
CREATE POLICY "Admin users can view admin_users" 
    ON admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "Admin can manage admin_users" 
    ON admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'admin'
        )
    );

-- Policies for deletion_logs (admin view only)
CREATE POLICY "Admin users can view deletion_logs" 
    ON deletion_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "System can insert deletion_logs" 
    ON deletion_logs FOR INSERT
    WITH CHECK (true); -- Logs should be insertable by system functions

-- ============================================
-- 4. Grant appropriate permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on views (now with SECURITY INVOKER)
GRANT SELECT ON public.deletion_safety_status TO authenticated;
GRANT SELECT ON public.user_session_dashboard TO authenticated;
GRANT SELECT ON public.pending_permanent_deletion TO authenticated;

-- ============================================
-- End of migration
-- ============================================
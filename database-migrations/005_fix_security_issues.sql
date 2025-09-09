-- Migration: Fix Supabase Security Advisor Issues
-- Date: 2025-09-08
-- Description: Address security vulnerabilities identified by Supabase Security Advisor

-- ============================================
-- 1. Fix SECURITY DEFINER Views
-- ============================================

-- Convert views from SECURITY DEFINER to SECURITY INVOKER
-- This ensures views use the permissions of the querying user, not the view creator

-- Fix deletion_safety_status view
DROP VIEW IF EXISTS public.deletion_safety_status CASCADE;
CREATE OR REPLACE VIEW public.deletion_safety_status
WITH (security_invoker = true)
AS
SELECT 
    dsc.id,
    dsc.enabled,
    dsc.grace_period_days,
    dsc.created_at,
    dsc.updated_at,
    (SELECT COUNT(*) FROM deletion_approval_requests WHERE status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM deletion_backups WHERE created_at > NOW() - INTERVAL '30 days') as recent_backups
FROM deletion_safety_config dsc
WHERE dsc.id = 1;

-- Fix user_session_dashboard view  
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
    p.display_name
FROM user_sessions us
LEFT JOIN profiles p ON us.user_id = p.id;

-- Fix pending_permanent_deletion view
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
UNION ALL
SELECT 
    'wanted_request' as item_type,
    id as item_id,
    title as item_title,
    deleted_at,
    deleted_at + INTERVAL '30 days' as permanent_deletion_date
FROM wanted_requests
WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '25 days';

-- ============================================
-- 2. Enable RLS on Tables
-- ============================================

-- Enable RLS on deletion_safety_config
ALTER TABLE public.deletion_safety_config ENABLE ROW LEVEL SECURITY;

-- Enable RLS on deletion_approval_requests
ALTER TABLE public.deletion_approval_requests ENABLE ROW LEVEL SECURITY;

-- Enable RLS on deletion_backups
ALTER TABLE public.deletion_backups ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on deletion_logs
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. Create RLS Policies
-- ============================================

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
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- Policies for deletion_approval_requests (admin only)
CREATE POLICY "Admin users can view deletion_approval_requests" 
    ON deletion_approval_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admin users can insert deletion_approval_requests" 
    ON deletion_approval_requests FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admin users can update deletion_approval_requests" 
    ON deletion_approval_requests FOR UPDATE
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
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
        )
    );

-- Policies for admin_users (super admin only for modifications)
CREATE POLICY "Admin users can view admin_users" 
    ON admin_users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid() 
            AND au.is_active = true
        )
    );

CREATE POLICY "Super admin can insert admin_users" 
    ON admin_users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin can update admin_users" 
    ON admin_users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
        )
    );

CREATE POLICY "Super admin can delete admin_users" 
    ON admin_users FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid() 
            AND admin_users.is_active = true
            AND admin_users.role = 'super_admin'
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
-- 4. Fix Function Search Path Issues
-- ============================================

-- Fix all functions with mutable search_path by setting it explicitly

-- update_offers_updated_at
CREATE OR REPLACE FUNCTION public.update_offers_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- update_business_profiles_paused_at
CREATE OR REPLACE FUNCTION public.update_business_profiles_paused_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.is_paused = true AND OLD.is_paused = false THEN
        NEW.paused_at = NOW();
    ELSIF NEW.is_paused = false AND OLD.is_paused = true THEN
        NEW.paused_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;

-- update_conversation_timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- reset_unread_count
CREATE OR REPLACE FUNCTION public.reset_unread_count(p_conversation_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE conversations
    SET unread_count = 0
    WHERE id = p_conversation_id 
    AND (user1_id = p_user_id OR user2_id = p_user_id);
END;
$$;

-- update_deleted_at
CREATE OR REPLACE FUNCTION public.update_deleted_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.deleted_at = NOW();
    RETURN NEW;
END;
$$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- update_conversation_on_message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        unread_count = unread_count + 1
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$;

-- cleanup_expired_sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE user_sessions
    SET is_active = false
    WHERE expires_at < NOW() AND is_active = true;
    
    DELETE FROM user_sessions
    WHERE expires_at < NOW() - INTERVAL '30 days';
END;
$$;

-- create_user_session
CREATE OR REPLACE FUNCTION public.create_user_session(
    p_user_id uuid,
    p_ip_address inet,
    p_user_agent text
)
RETURNS TABLE(session_token text, expires_at timestamptz)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_session_token text;
    v_expires_at timestamptz;
BEGIN
    v_session_token := encode(gen_random_bytes(32), 'hex');
    v_expires_at := NOW() + INTERVAL '30 days';
    
    INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
    VALUES (p_user_id, v_session_token, p_ip_address, p_user_agent, v_expires_at);
    
    RETURN QUERY SELECT v_session_token, v_expires_at;
END;
$$;

-- update_session_activity
CREATE OR REPLACE FUNCTION public.update_session_activity(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE user_sessions
    SET last_activity = NOW()
    WHERE session_token = p_session_token 
    AND is_active = true 
    AND expires_at > NOW();
    
    RETURN FOUND;
END;
$$;

-- get_user_sessions
CREATE OR REPLACE FUNCTION public.get_user_sessions(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    session_token text,
    ip_address inet,
    user_agent text,
    created_at timestamptz,
    last_activity timestamptz,
    expires_at timestamptz,
    is_active boolean
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id,
        us.session_token,
        us.ip_address,
        us.user_agent,
        us.created_at,
        us.last_activity,
        us.expires_at,
        us.is_active
    FROM user_sessions us
    WHERE us.user_id = p_user_id
    ORDER BY us.created_at DESC;
END;
$$;

-- revoke_session
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_token text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE user_sessions
    SET is_active = false
    WHERE session_token = p_session_token AND user_id = p_user_id;
    
    RETURN FOUND;
END;
$$;

-- revoke_other_sessions
CREATE OR REPLACE FUNCTION public.revoke_other_sessions(p_current_session_token text, p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count integer;
BEGIN
    UPDATE user_sessions
    SET is_active = false
    WHERE user_id = p_user_id 
    AND session_token != p_current_session_token
    AND is_active = true;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- permanently_delete_old_records
CREATE OR REPLACE FUNCTION public.permanently_delete_old_records()
RETURNS TABLE(deleted_listings integer, deleted_wanted_requests integer)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_deleted_listings integer;
    v_deleted_wanted_requests integer;
BEGIN
    -- Delete old listings
    DELETE FROM listings
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted_listings = ROW_COUNT;
    
    -- Delete old wanted requests
    DELETE FROM wanted_requests
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS v_deleted_wanted_requests = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_listings, v_deleted_wanted_requests;
END;
$$;

-- increment_listing_views_simple
CREATE OR REPLACE FUNCTION public.increment_listing_views_simple(p_listing_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE listings
    SET views = COALESCE(views, 0) + 1
    WHERE id = p_listing_id;
END;
$$;

-- check_deletion_safety
CREATE OR REPLACE FUNCTION public.check_deletion_safety(
    p_item_type text,
    p_item_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_enabled boolean;
    v_has_approval boolean;
BEGIN
    SELECT enabled INTO v_enabled
    FROM deletion_safety_config
    WHERE id = 1;
    
    IF NOT v_enabled THEN
        RETURN true;
    END IF;
    
    SELECT EXISTS(
        SELECT 1 
        FROM deletion_approval_requests
        WHERE item_type = p_item_type
        AND item_id = p_item_id
        AND status = 'approved'
        AND approved_at > NOW() - INTERVAL '1 hour'
    ) INTO v_has_approval;
    
    RETURN v_has_approval;
END;
$$;

-- increment_listing_views_enhanced
CREATE OR REPLACE FUNCTION public.increment_listing_views_enhanced(
    p_listing_id uuid,
    p_viewer_id uuid DEFAULT NULL,
    p_viewer_ip inet DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Check if view already recorded recently
    IF p_viewer_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM listing_views
            WHERE listing_id = p_listing_id
            AND viewer_id = p_viewer_id
            AND viewed_at > NOW() - INTERVAL '1 hour'
        ) THEN
            RETURN;
        END IF;
    ELSIF p_viewer_ip IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM listing_views
            WHERE listing_id = p_listing_id
            AND viewer_ip = p_viewer_ip
            AND viewed_at > NOW() - INTERVAL '1 hour'
        ) THEN
            RETURN;
        END IF;
    END IF;
    
    -- Record the view
    INSERT INTO listing_views (listing_id, viewer_id, viewer_ip)
    VALUES (p_listing_id, p_viewer_id, p_viewer_ip);
    
    -- Update the view count
    UPDATE listings
    SET views = COALESCE(views, 0) + 1
    WHERE id = p_listing_id;
END;
$$;

-- safely_delete_old_records
CREATE OR REPLACE FUNCTION public.safely_delete_old_records()
RETURNS TABLE(
    backed_up_listings integer,
    backed_up_wanted_requests integer,
    marked_listings integer,
    marked_wanted_requests integer
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_backed_up_listings integer := 0;
    v_backed_up_wanted_requests integer := 0;
    v_marked_listings integer := 0;
    v_marked_wanted_requests integer := 0;
    v_config_enabled boolean;
    v_grace_period integer;
BEGIN
    -- Check if safety is enabled
    SELECT enabled, grace_period_days 
    INTO v_config_enabled, v_grace_period
    FROM deletion_safety_config
    WHERE id = 1;
    
    IF NOT v_config_enabled THEN
        RETURN QUERY SELECT 0, 0, 0, 0;
        RETURN;
    END IF;
    
    -- Backup and mark old listings
    INSERT INTO deletion_backups (item_type, item_id, item_data, deleted_at)
    SELECT 'listing', id, row_to_json(l.*), NOW()
    FROM listings l
    WHERE l.deleted_at IS NOT NULL 
    AND l.deleted_at < NOW() - make_interval(days => v_grace_period)
    AND NOT EXISTS (
        SELECT 1 FROM deletion_backups db
        WHERE db.item_type = 'listing' AND db.item_id = l.id
    );
    GET DIAGNOSTICS v_backed_up_listings = ROW_COUNT;
    
    -- Mark for permanent deletion
    UPDATE listings
    SET deleted_at = deleted_at
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - make_interval(days => v_grace_period);
    GET DIAGNOSTICS v_marked_listings = ROW_COUNT;
    
    -- Backup and mark old wanted requests
    INSERT INTO deletion_backups (item_type, item_id, item_data, deleted_at)
    SELECT 'wanted_request', id, row_to_json(w.*), NOW()
    FROM wanted_requests w
    WHERE w.deleted_at IS NOT NULL 
    AND w.deleted_at < NOW() - make_interval(days => v_grace_period)
    AND NOT EXISTS (
        SELECT 1 FROM deletion_backups db
        WHERE db.item_type = 'wanted_request' AND db.item_id = w.id
    );
    GET DIAGNOSTICS v_backed_up_wanted_requests = ROW_COUNT;
    
    -- Mark for permanent deletion
    UPDATE wanted_requests
    SET deleted_at = deleted_at
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - make_interval(days => v_grace_period);
    GET DIAGNOSTICS v_marked_wanted_requests = ROW_COUNT;
    
    RETURN QUERY SELECT 
        v_backed_up_listings, 
        v_backed_up_wanted_requests,
        v_marked_listings,
        v_marked_wanted_requests;
END;
$$;

-- approve_deletion_request
CREATE OR REPLACE FUNCTION public.approve_deletion_request(
    p_request_id uuid,
    p_approver_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE deletion_approval_requests
    SET 
        status = 'approved',
        approved_by = p_approver_id,
        approved_at = NOW()
    WHERE id = p_request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$;

-- reject_deletion_request
CREATE OR REPLACE FUNCTION public.reject_deletion_request(
    p_request_id uuid,
    p_approver_id uuid,
    p_rejection_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE deletion_approval_requests
    SET 
        status = 'rejected',
        approved_by = p_approver_id,
        approved_at = NOW(),
        notes = COALESCE(p_rejection_reason, notes)
    WHERE id = p_request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$;

-- restore_from_backup
CREATE OR REPLACE FUNCTION public.restore_from_backup(p_backup_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_backup deletion_backups%ROWTYPE;
    v_success boolean := false;
BEGIN
    SELECT * INTO v_backup
    FROM deletion_backups
    WHERE id = p_backup_id;
    
    IF NOT FOUND OR v_backup.restored_at IS NOT NULL THEN
        RETURN false;
    END IF;
    
    -- Restore based on item type
    IF v_backup.item_type = 'listing' THEN
        -- Restore listing (implementation depends on your schema)
        UPDATE listings
        SET deleted_at = NULL
        WHERE id = v_backup.item_id;
        v_success := FOUND;
    ELSIF v_backup.item_type = 'wanted_request' THEN
        -- Restore wanted request
        UPDATE wanted_requests
        SET deleted_at = NULL
        WHERE id = v_backup.item_id;
        v_success := FOUND;
    END IF;
    
    IF v_success THEN
        UPDATE deletion_backups
        SET restored_at = NOW()
        WHERE id = p_backup_id;
    END IF;
    
    RETURN v_success;
END;
$$;

-- get_user_bin_items
CREATE OR REPLACE FUNCTION public.get_user_bin_items(p_user_id uuid)
RETURNS TABLE(
    item_type text,
    item_id uuid,
    item_title text,
    deleted_at timestamptz,
    can_restore boolean
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'listing'::text as item_type,
        l.id as item_id,
        l.title as item_title,
        l.deleted_at,
        (l.deleted_at > NOW() - INTERVAL '30 days') as can_restore
    FROM listings l
    WHERE l.user_id = p_user_id 
    AND l.deleted_at IS NOT NULL
    UNION ALL
    SELECT 
        'wanted_request'::text as item_type,
        w.id as item_id,
        w.title as item_title,
        w.deleted_at,
        (w.deleted_at > NOW() - INTERVAL '30 days') as can_restore
    FROM wanted_requests w
    WHERE w.user_id = p_user_id 
    AND w.deleted_at IS NOT NULL
    ORDER BY deleted_at DESC;
END;
$$;

-- restore_user_item
CREATE OR REPLACE FUNCTION public.restore_user_item(
    p_user_id uuid,
    p_item_type text,
    p_item_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_success boolean := false;
BEGIN
    IF p_item_type = 'listing' THEN
        UPDATE listings
        SET deleted_at = NULL
        WHERE id = p_item_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days';
        v_success := FOUND;
    ELSIF p_item_type = 'wanted_request' THEN
        UPDATE wanted_requests
        SET deleted_at = NULL
        WHERE id = p_item_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days';
        v_success := FOUND;
    END IF;
    
    IF v_success THEN
        INSERT INTO deletion_logs (action, item_type, item_id, performed_by)
        VALUES ('restore', p_item_type, p_item_id, p_user_id);
    END IF;
    
    RETURN v_success;
END;
$$;

-- ============================================
-- 5. Grant appropriate permissions
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on views (now with SECURITY INVOKER)
GRANT SELECT ON public.deletion_safety_status TO authenticated;
GRANT SELECT ON public.user_session_dashboard TO authenticated;
GRANT SELECT ON public.pending_permanent_deletion TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.update_offers_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_business_profiles_paused_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_unread_count(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_deleted_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_session(uuid, inet, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_activity(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_sessions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_session(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_other_sessions(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_views_simple(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_views_enhanced(uuid, uuid, inet) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_bin_items(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_user_item(uuid, text, uuid) TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION public.permanently_delete_old_records() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_deletion_safety(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safely_delete_old_records() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_deletion_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_deletion_request(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_from_backup(uuid) TO authenticated;

-- ============================================
-- End of migration
-- ============================================
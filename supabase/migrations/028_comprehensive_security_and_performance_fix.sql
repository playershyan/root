-- 028_comprehensive_security_and_performance_fix.sql
-- Comprehensive hardening: RLS enforcement, function hardening, missing indexes,
-- admin self-check policy, session insert policies, and rotation RPC fixes.

BEGIN;

-- 1) Enforce RLS even for table owners (defense-in-depth)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'public.listings',
    'public.wanted_requests',
    'public.profiles',
    'public.business_profiles',
    'public.conversations',
    'public.messages',
    'public.offers',
    'public.user_sessions',
    'public.session_activity',
    'public.listing_views',
    'public.admin_users',
    'public.deletion_safety_config',
    'public.deletion_approval_requests',
    'public.deletion_backups',
    'public.deletion_logs',
    'public.cleanup_logs',
    'public.recovery_requests',
    'public.deleted_business_profiles',
    'public.deleted_listings',
    'public.deleted_wanted_requests',
    'public.promotions'
  ] LOOP
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 2) Session tables: allow user-scoped INSERT so we can move functions to INVOKER safely later
-- user_sessions INSERT (self only)
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.user_sessions;
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- session_activity INSERT (self only)
DROP POLICY IF EXISTS "Users can insert own session activity" ON public.session_activity;
CREATE POLICY "Users can insert own session activity" ON public.session_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3) Admin self-check: allow users to read ONLY their own admin_users row
DROP POLICY IF EXISTS "Users can view own admin row" ON public.admin_users;
CREATE POLICY "Users can view own admin row" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- 4) Harden SECURITY DEFINER functions against search_path attacks by pinning to public,pg_temp
--    (Leaves security mode unchanged; FORCE RLS above ensures RLS applies even for owners.)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT n.nspname AS schema_name,
           p.proname AS function_name,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'create_user_session',
        'update_session_activity',
        'get_user_sessions',
        'revoke_session',
        'revoke_other_sessions',
        'cleanup_expired_sessions',
        'permanently_delete_old_records',
        'increment_listing_views',
        'increment_listing_views_simple',
        'increment_listing_views_enhanced',
        'cleanup_old_deleted_records',
        'cleanup_old_deleted_records_monitored',
        'check_deletion_safety',
        'handle_business_profile_deletion',
        'handle_business_profile_deletion_with_recovery',
        'recover_business_profile',
        'check_business_profile_recovery',
        'get_rotated_featured_ads',
        'get_rotated_top_spot_ads',
        'apply_daily_boost',
        'reset_daily_rotation_scores',
        'run_cleanup_deleted_items',
        'refresh_pending_deletion_summary',
        'check_and_trigger_alerts',
        'get_recent_alerts',
        'get_admin_bin_statistics',
        'admin_trigger_bin_cleanup',
        'approve_deletion_request',
        'reject_deletion_request',
        'restore_from_backup',
        'get_user_bin_items',
        'restore_user_item'
      )
  ) LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
        r.schema_name, r.function_name, r.args);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore functions not present in the target database
      NULL;
    END;
  END LOOP;
END $$;

-- 5) Provide a secure, RLS-compatible has_admin_access (no dev fallback)
--    Relies on policy (3) so it can run as INVOKER.
CREATE OR REPLACE FUNCTION public.has_admin_access(check_user_id UUID)
RETURNS TABLE (
  is_admin BOOLEAN,
  user_role TEXT,
  user_permissions JSONB,
  is_fallback BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.admin_users au
      WHERE au.user_id = check_user_id AND au.is_active = true
    ) AS is_admin,
    (SELECT au.role FROM public.admin_users au
      WHERE au.user_id = check_user_id AND au.is_active = true
      LIMIT 1) AS user_role,
    (SELECT au.permissions FROM public.admin_users au
      WHERE au.user_id = check_user_id AND au.is_active = true
      LIMIT 1) AS user_permissions,
    false::boolean AS is_fallback;
$$;

GRANT EXECUTE ON FUNCTION public.has_admin_access(UUID) TO authenticated;

COMMENT ON FUNCTION public.has_admin_access(UUID) IS 'RLS-friendly admin check with no development fallback.';

-- 6) Fix rotation functions to avoid ambiguous columns and pin search_path
CREATE OR REPLACE FUNCTION public.get_rotated_featured_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
    FROM public.promotions AS p
    JOIN public.listings AS l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.body_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions AS p2
    SET last_shown_at = NOW(),
        impressions = p2.impressions + 1,
        rotation_score = p2.rotation_score + 1
    FROM candidates c
    WHERE p2.id = c.id
    RETURNING p2.listing_id, p2.id AS promotion_id, p2.rotation_score, p2.impressions
  )
  SELECT u.listing_id, u.promotion_id, u.rotation_score, u.impressions FROM updated u;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_rotated_top_spot_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
    FROM public.promotions AS p
    JOIN public.listings AS l ON l.id = p.listing_id
    WHERE p.promotion_type = 'top_spot'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.body_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions AS p2
    SET last_shown_at = NOW(),
        impressions = p2.impressions + 1,
        rotation_score = p2.rotation_score + 1
    FROM candidates c
    WHERE p2.id = c.id
    RETURNING p2.listing_id, p2.id AS promotion_id, p2.rotation_score, p2.impressions
  )
  SELECT u.listing_id, u.promotion_id, u.rotation_score, u.impressions FROM updated u;
END;
$$;

-- Do NOT grant these rotation functions broadly; call via service role or internal jobs only

-- 7) Add commonly-missed FK indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_fk ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_fk ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing_id_fk ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_alerts_listing_id_fk ON public.alerts(listing_id);

COMMIT;


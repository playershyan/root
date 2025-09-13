-- Supabase Cron Jobs Configuration (enhanced reliability, logging, idempotency)
-- This file sets up scheduled jobs for automatic maintenance with robust error handling

-- 1) Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- 2) Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- 3) Generic cron job execution log
CREATE TABLE IF NOT EXISTS public.cron_job_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  run_key TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','failure','skipped')),
  error_message TEXT,
  rows_affected JSONB DEFAULT '{}'::jsonb,
  attempt INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_job_log_job_name_started ON public.cron_job_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_job_log_status ON public.cron_job_log(status);

-- Unique guard to make daily jobs idempotent per day per job_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'uniq_cron_job_daily_key'
  ) THEN
    EXECUTE $$CREATE UNIQUE INDEX uniq_cron_job_daily_key
             ON public.cron_job_log(job_name, (started_at::date), COALESCE(run_key, ''))
             WHERE status IN ('running','success')$$;
  END IF;
END$$;

-- 4) Wrapper: cleanup deleted items with transactional logging and idempotency
--    Uses advisory lock to prevent overlapping runs.
CREATE OR REPLACE FUNCTION public.run_cleanup_deleted_items(p_run_key TEXT DEFAULT to_char(NOW(), 'YYYY-MM-DD'))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_deleted_listings INTEGER := 0;
  v_deleted_wanted INTEGER := 0;
  v_locked BOOLEAN;
BEGIN
  -- Ensure at-most-once per day via idempotent log + advisory lock
  v_locked := pg_try_advisory_lock(hashtext('cleanup-deleted-items'));
  IF NOT v_locked THEN
    INSERT INTO public.cron_job_log(job_name, run_key, status, error_message)
    VALUES ('cleanup-deleted-items', p_run_key, 'skipped', 'Another run is in progress (advisory lock).');
    RETURN;
  END IF;

  -- If a successful run already exists today with same run_key, skip
  IF EXISTS (
    SELECT 1 FROM public.cron_job_log 
    WHERE job_name = 'cleanup-deleted-items' 
      AND started_at::date = CURRENT_DATE
      AND COALESCE(run_key, '') = COALESCE(p_run_key, '')
      AND status = 'success'
  ) THEN
    INSERT INTO public.cron_job_log(job_name, run_key, status, error_message)
    VALUES ('cleanup-deleted-items', p_run_key, 'skipped', 'Already successfully executed for this day/run_key.');
    PERFORM pg_advisory_unlock(hashtext('cleanup-deleted-items'));
    RETURN;
  END IF;

  INSERT INTO public.cron_job_log(job_name, run_key)
  VALUES ('cleanup-deleted-items', p_run_key)
  RETURNING id INTO v_log_id;

  BEGIN
    -- Critical section lock
    PERFORM pg_advisory_lock(hashtext('cleanup-delete-critical-section'));

    -- Execute cleanup function and capture counts
    SELECT deleted_listings, deleted_wanted_requests
    INTO v_deleted_listings, v_deleted_wanted
    FROM permanently_delete_old_records();

    -- Mark success
    UPDATE public.cron_job_log
    SET 
      status = 'success',
      finished_at = NOW(),
      rows_affected = jsonb_build_object(
        'deleted_listings', COALESCE(v_deleted_listings,0),
        'deleted_wanted_requests', COALESCE(v_deleted_wanted,0)
      )
    WHERE id = v_log_id;

    -- Always unlock on success
    PERFORM pg_advisory_unlock(hashtext('cleanup-delete-critical-section'));
    PERFORM pg_advisory_unlock(hashtext('cleanup-deleted-items'));

  EXCEPTION WHEN OTHERS THEN
    -- On failure, log and unlock, then re-raise
    UPDATE public.cron_job_log
    SET 
      status = 'failure',
      finished_at = NOW(),
      error_message = SQLERRM
    WHERE id = v_log_id;
    PERFORM pg_advisory_unlock(hashtext('cleanup-delete-critical-section'));
    PERFORM pg_advisory_unlock(hashtext('cleanup-deleted-items'));
    RAISE;
  END;
END;
$$;

-- 5) Materialized view for pending deletion summary to avoid heavy COUNT(*) on large tables
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pending_deletion_summary AS
WITH l AS (
  SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false)                AS pending_listings,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW()) AS overdue_listings,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day') AS imminent_listings
  FROM public.listings
), w AS (
  SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false)                AS pending_wanted_requests,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW()) AS overdue_wanted_requests,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day') AS imminent_wanted_requests
  FROM public.wanted_requests
)
SELECT 
  NOW() AS snapshot_time,
  l.pending_listings,
  w.pending_wanted_requests,
  (l.overdue_listings + w.overdue_wanted_requests)     AS overdue_items,
  (l.imminent_listings + w.imminent_wanted_requests)   AS imminent_items
FROM l, w;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_deletion_summary_snapshot ON public.pending_deletion_summary(snapshot_time);

-- 6) Refresh function for the materialized view with logging
CREATE OR REPLACE FUNCTION public.refresh_pending_deletion_summary(p_run_key TEXT DEFAULT to_char(NOW(), 'IYYY-IW'))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Optional: prevent overlapping refreshes
  IF NOT pg_try_advisory_lock(hashtext('refresh-pending-deletion-summary')) THEN
    INSERT INTO public.cron_job_log(job_name, run_key, status, error_message)
    VALUES ('deletion-summary', p_run_key, 'skipped', 'Another refresh is running.');
    RETURN;
  END IF;

  INSERT INTO public.cron_job_log(job_name, run_key)
  VALUES ('deletion-summary', p_run_key)
  RETURNING id INTO v_log_id;

  BEGIN
    REFRESH MATERIALIZED VIEW public.pending_deletion_summary;

    UPDATE public.cron_job_log
    SET status = 'success', finished_at = NOW(),
        rows_affected = (
          SELECT to_jsonb(s) - 'snapshot_time'
          FROM public.pending_deletion_summary s
          ORDER BY snapshot_time DESC
          LIMIT 1
        )
    WHERE id = v_log_id;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.cron_job_log
    SET status = 'failure', finished_at = NOW(), error_message = SQLERRM
    WHERE id = v_log_id;
  END;

  PERFORM pg_advisory_unlock(hashtext('refresh-pending-deletion-summary'));
END;
$$;

-- 7) Schedules
-- Daily cleanup of soft-deleted items older than 30 days at 02:00 UTC
SELECT cron.schedule(
  'cleanup-deleted-items',
  '0 2 * * *',
  $$SELECT public.run_cleanup_deleted_items();$$
);

-- Weekly summary refresh (uses MV) every Monday 09:00 UTC
SELECT cron.schedule(
  'deletion-summary',
  '0 9 * * 1',
  $$SELECT public.refresh_pending_deletion_summary();$$
);

-- Admin alert checks every 15 minutes (if alert functions are installed)
SELECT cron.schedule(
  'admin-alerts-check',
  '*/15 * * * *',
  $$SELECT check_and_trigger_alerts();$$
);

-- 8) Helpers
-- View scheduled jobs
SELECT * FROM cron.job;

-- Unschedule helpers (if needed):
-- SELECT cron.unschedule('cleanup-deleted-items');
-- SELECT cron.unschedule('deletion-summary');

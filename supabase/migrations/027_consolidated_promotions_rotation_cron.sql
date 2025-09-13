-- 027_consolidated_promotions_rotation_cron.sql
-- Consolidates promotions schema, RLS, rotation functions, indexes,
-- cron job logging and schedules, with idempotent guards.

-- ============================
-- Extensions (idempotent)
-- ============================
CREATE EXTENSION IF NOT EXISTS pgcrypto;         -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_cron;          -- cron

-- ============================
-- Promotions Schema + Indexes
-- ============================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  promotion_type VARCHAR(50) NOT NULL, -- 'featured', 'top_spot', 'boost', 'urgent'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_boosted_at TIMESTAMPTZ,
  payment_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing promotion flags (safe to re-run)
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_top_spot BOOLEAN DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS top_spot_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS urgent_until TIMESTAMPTZ;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_promotions_listing_id ON public.promotions(listing_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON public.promotions(promotion_type, is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_expires ON public.promotions(expires_at);

-- Listing-side performance
CREATE INDEX IF NOT EXISTS idx_listings_boost_sort ON public.listings (is_boosted, boost_score DESC, posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_featured_active ON public.listings (posted_date DESC) WHERE status='active' AND is_featured = true;

-- ============================
-- Promotions RLS Policies
-- ============================
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='promotions' AND policyname='read_promotions_for_active_or_owner'
  ) THEN
    CREATE POLICY "read_promotions_for_active_or_owner" ON public.promotions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = promotions.listing_id
            AND (l.status = 'active' OR auth.uid() = l.user_id)
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='promotions' AND policyname='owner_insert_promotions'
  ) THEN
    CREATE POLICY "owner_insert_promotions" ON public.promotions
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = promotions.listing_id
            AND auth.uid() = l.user_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='promotions' AND policyname='owner_update_promotions'
  ) THEN
    CREATE POLICY "owner_update_promotions" ON public.promotions
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = promotions.listing_id
            AND auth.uid() = l.user_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='promotions' AND policyname='owner_delete_promotions'
  ) THEN
    CREATE POLICY "owner_delete_promotions" ON public.promotions
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.listings l
          WHERE l.id = promotions.listing_id
            AND auth.uid() = l.user_id
        )
      );
  END IF;
END$$;

-- ============================
-- Rotation Metrics + Functions
-- ============================
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS rotation_score INTEGER DEFAULT 0;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS last_shown_at TIMESTAMPTZ;
ALTER TABLE public.promotions ADD COLUMN IF NOT EXISTS rotation_group VARCHAR(50);

-- Featured rotation (concurrency-safe, fair)
CREATE OR REPLACE FUNCTION public.get_rotated_featured_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
    FROM public.promotions p
    JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.body_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET last_shown_at = NOW(),
        impressions = p.impressions + 1,
        rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.id
    RETURNING p.listing_id, p.id AS promotion_id, p.rotation_score, p.impressions
  )
  SELECT listing_id, promotion_id, rotation_score, impressions FROM updated;
END;
$$ LANGUAGE plpgsql;

-- Top spot rotation (concurrency-safe, fair)
CREATE OR REPLACE FUNCTION public.get_rotated_top_spot_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id
    FROM public.promotions p
    JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'top_spot'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.body_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET last_shown_at = NOW(),
        impressions = p.impressions + 1,
        rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.id
    RETURNING p.listing_id, p.id AS promotion_id, p.rotation_score, p.impressions
  )
  SELECT listing_id, promotion_id, rotation_score, impressions FROM updated;
END;
$$ LANGUAGE plpgsql;

-- Daily boost reorder (idempotent)
CREATE OR REPLACE FUNCTION public.apply_daily_boost()
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET boost_score = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE is_boosted = true
    AND boosted_until > NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: reset rotation scores daily
CREATE OR REPLACE FUNCTION public.reset_daily_rotation_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.promotions
  SET rotation_score = 0
  WHERE is_active = true
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================
-- Cron Job Logging + Summary MV
-- ============================
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

-- Simple index for cron job uniqueness (without date casting)
CREATE INDEX IF NOT EXISTS idx_cron_job_log_uniqueness ON public.cron_job_log(job_name, started_at, run_key) WHERE status IN ('running','success');

-- Summary MV (replaces heavy COUNT(*) during weekly summary)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pending_deletion_summary AS
WITH l AS (
  SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false) AS pending_listings,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW()) AS overdue_listings,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day') AS imminent_listings
  FROM public.listings
), w AS (
  SELECT 
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false) AS pending_wanted_requests,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW()) AS overdue_wanted_requests,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL AND permanently_deleted = false AND deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day') AS imminent_wanted_requests
  FROM public.wanted_requests
)
SELECT 
  NOW() AS snapshot_time,
  l.pending_listings,
  w.pending_wanted_requests,
  (l.overdue_listings + w.overdue_wanted_requests)   AS overdue_items,
  (l.imminent_listings + w.imminent_wanted_requests) AS imminent_items
FROM l, w;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_deletion_summary_snapshot ON public.pending_deletion_summary(snapshot_time);

-- ============================
-- Cron Wrappers + Schedules (guarded)
-- ============================
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
  v_locked := pg_try_advisory_lock(hashtext('cleanup-deleted-items'));
  IF NOT v_locked THEN
    INSERT INTO public.cron_job_log(job_name, run_key, status, error_message)
    VALUES ('cleanup-deleted-items', p_run_key, 'skipped', 'Another run is in progress (advisory lock).');
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.cron_job_log 
    WHERE job_name = 'cleanup-deleted-items' 
      AND started_at::date = CURRENT_DATE
      AND (run_key = p_run_key OR (run_key IS NULL AND p_run_key IS NULL))
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
    PERFORM pg_advisory_lock(hashtext('cleanup-delete-critical-section'));

    SELECT deleted_listings, deleted_wanted_requests
    INTO v_deleted_listings, v_deleted_wanted
    FROM permanently_delete_old_records();

    UPDATE public.cron_job_log
    SET status = 'success', finished_at = NOW(),
        rows_affected = jsonb_build_object(
          'deleted_listings', COALESCE(v_deleted_listings,0),
          'deleted_wanted_requests', COALESCE(v_deleted_wanted,0)
        )
    WHERE id = v_log_id;

    PERFORM pg_advisory_unlock(hashtext('cleanup-delete-critical-section'));
    PERFORM pg_advisory_unlock(hashtext('cleanup-deleted-items'));

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.cron_job_log
    SET status = 'failure', finished_at = NOW(), error_message = SQLERRM
    WHERE id = v_log_id;
    PERFORM pg_advisory_unlock(hashtext('cleanup-delete-critical-section'));
    PERFORM pg_advisory_unlock(hashtext('cleanup-deleted-items'));
    RAISE;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_pending_deletion_summary(p_run_key TEXT DEFAULT to_char(NOW(), 'IYYY-IW'))
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
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

-- ============================
-- Guarded Cron Scheduling
-- ============================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-deleted-items') THEN
    PERFORM cron.schedule(
      'cleanup-deleted-items',
      '0 2 * * *',
      $cron$SELECT public.run_cleanup_deleted_items();$cron$
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'deletion-summary') THEN
    PERFORM cron.schedule(
      'deletion-summary',
      '0 9 * * 1',
      $cron$SELECT public.refresh_pending_deletion_summary();$cron$
    );
  END IF;

  -- Schedule alerts only if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_and_trigger_alerts'
  ) AND NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'admin-alerts-check'
  ) THEN
    PERFORM cron.schedule(
      'admin-alerts-check',
      '*/15 * * * *',
      $cron$SELECT check_and_trigger_alerts();$cron$
    );
  END IF;
END$$;


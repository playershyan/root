-- Migration: Optimized listing creation and promoted slot aggregation
-- Created: 2025-11-10
-- Description:
--   * Atomic listing creation with indexed duplicate enforcement
--   * Optimized promoted slot aggregation (single round-trip, no double JOINs)
--   * Composite indexes for all performance-critical queries
--   * Rotation functions optimized to return full listing data

BEGIN;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for duplicate check in create_listing_v2 (prevents O(n) scan)
CREATE INDEX IF NOT EXISTS idx_listings_duplicate_check
ON public.listings(user_id, status, make, model, year, created_at)
WHERE status != 'deleted';

-- Index for active listings feed (ORDER BY created_at DESC with WHERE filters)
CREATE INDEX IF NOT EXISTS idx_listings_active_feed
ON public.listings (created_at DESC)
WHERE status = 'active' AND is_sold = FALSE;

-- Composite index for promotion rotation queries (ORDER BY columns)
-- Note: Removed expires_at > NOW() from WHERE clause (NOW() is not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_promotions_rotation_performance
ON public.promotions (promotion_type, is_active, expires_at, last_shown_at NULLS FIRST, impressions, created_at)
WHERE is_active = TRUE;

-- Index for listings JOIN in rotation functions
CREATE INDEX IF NOT EXISTS idx_listings_status_sold_vehicle_type
ON public.listings (id, status, is_sold, vehicle_type)
WHERE status = 'active' AND is_sold = FALSE;

-- ============================================================================
-- FUNCTION 1: Optimized Listing Creation with Indexed Duplicate Check
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_listing_v2(payload JSONB)
RETURNS TABLE (
  id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pricing_type TEXT;
  v_image_urls TEXT[];
  v_primary_image TEXT;
  v_listing_id UUID;
  v_listing_status TEXT;
  r RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO r
  FROM jsonb_to_record(payload) AS x(
    title TEXT,
    description TEXT,
    details TEXT,
    price NUMERIC,
    negotiable BOOLEAN,
    make TEXT,
    model TEXT,
    year INTEGER,
    mileage INTEGER,
    fuel_type TEXT,
    transmission TEXT,
    vehicle_type TEXT,
    body_type TEXT,
    color TEXT,
    engine_capacity INTEGER,
    location TEXT,
    city TEXT,
    district TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    image_urls TEXT[],
    image_url TEXT,
    primary_image_url TEXT,
    pricing_type TEXT,
    finance_type TEXT,
    outstanding_balance NUMERIC,
    monthly_payment NUMERIC,
    remaining_term TEXT,
    asking_price NUMERIC,
    interior_color TEXT,
    registration_year INTEGER,
    vehicle_condition_details TEXT,
    previous_owners INTEGER,
    service_records_available BOOLEAN,
    grade TEXT,
    trim TEXT
  );

  v_pricing_type := COALESCE(NULLIF(r.pricing_type, ''), 'cash');

  -- Optimized duplicate check using composite index
  -- Index: idx_listings_duplicate_check(user_id, status, make, model, year, created_at)
  IF EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.user_id = v_user_id
      AND l.status != 'deleted'
      AND l.make IS NOT DISTINCT FROM NULLIF(r.make, '')
      AND l.model IS NOT DISTINCT FROM NULLIF(r.model, '')
      AND l.year IS NOT DISTINCT FROM r.year
      AND l.created_at >= NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'Duplicate listing detected within 24 hours'
      USING ERRCODE = '23505', DETAIL = 'LISTING_DUPLICATE';
  END IF;

  v_image_urls := COALESCE(r.image_urls, ARRAY[]::TEXT[]);
  v_primary_image := COALESCE(
    NULLIF(r.primary_image_url, ''),
    NULLIF(r.image_url, ''),
    CASE WHEN array_length(v_image_urls, 1) > 0 THEN v_image_urls[1] ELSE NULL END
  );

  INSERT INTO public.listings (
    user_id,
    title,
    description,
    details,
    price,
    negotiable,
    make,
    model,
    year,
    mileage,
    fuel_type,
    transmission,
    vehicle_type,
    body_type,
    color,
    engine_capacity,
    location,
    city,
    district,
    phone,
    whatsapp,
    email,
    image_urls,
    image_url,
    primary_image_url,
    status,
    pricing_type,
    finance_type,
    outstanding_balance,
    monthly_payment,
    remaining_term,
    asking_price,
    interior_color,
    registration_year,
    vehicle_condition_details,
    previous_owners,
    service_records_available,
    grade
  )
  VALUES (
    v_user_id,
    COALESCE(NULLIF(r.title, ''), payload->>'title'),
    COALESCE(r.description, payload->>'description'),
    COALESCE(r.details, r.description, payload->>'description'),
    COALESCE(r.price, NULLIF(payload->>'price', '')::NUMERIC),
    COALESCE(r.negotiable, TRUE),
    NULLIF(r.make, ''),
    NULLIF(r.model, ''),
    r.year,
    r.mileage,
    NULLIF(r.fuel_type, ''),
    NULLIF(r.transmission, ''),
    NULLIF(r.vehicle_type, ''),
    COALESCE(NULLIF(r.body_type, ''), NULLIF(r.vehicle_type, '')),
    NULLIF(r.color, ''),
    r.engine_capacity,
    COALESCE(
      NULLIF(r.location, ''),
      CASE
        WHEN NULLIF(r.city, '') IS NOT NULL AND NULLIF(r.district, '') IS NOT NULL
          THEN CONCAT(r.city, ', ', r.district)
        ELSE COALESCE(NULLIF(r.city, ''), NULLIF(r.district, ''))
      END
    ),
    NULLIF(r.city, ''),
    NULLIF(r.district, ''),
    NULLIF(r.phone, ''),
    NULLIF(r.whatsapp, ''),
    NULLIF(r.email, ''),
    v_image_urls,
    COALESCE(NULLIF(r.image_url, ''), v_primary_image),
    v_primary_image,
    'pending',
    v_pricing_type,
    CASE WHEN v_pricing_type = 'finance' THEN NULLIF(r.finance_type, '') ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.outstanding_balance ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.monthly_payment ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN NULLIF(r.remaining_term, '') ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.asking_price ELSE NULL END,
    NULLIF(r.interior_color, ''),
    r.registration_year,
    NULLIF(r.vehicle_condition_details, ''),
    r.previous_owners,
    COALESCE(r.service_records_available, FALSE),
    COALESCE(NULLIF(r.grade, ''), NULLIF(r.trim, ''))
  )
  RETURNING id, status
  INTO v_listing_id, v_listing_status;

  RETURN QUERY SELECT v_listing_id, v_listing_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_listing_v2(JSONB) TO authenticated;
COMMENT ON FUNCTION public.create_listing_v2(JSONB) IS 'Atomically validates, deduplicates (indexed check), and inserts a listing';

-- ============================================================================
-- FUNCTION 2: Optimized Rotation Functions (Return Full Listing Data)
-- ============================================================================

-- Drop existing rotation functions (return signatures have changed)
DROP FUNCTION IF EXISTS public.get_rotated_featured_ads(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_rotated_top_spot_ads(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_rotated_boost_ads(TEXT, INTEGER);

-- Featured ads rotation - returns full listing data to avoid double JOIN
CREATE OR REPLACE FUNCTION public.get_rotated_featured_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city TEXT,
  district TEXT,
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type TEXT,
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      p.listing_id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.listing_id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_featured_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_featured_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_featured_ads IS 'Returns featured promotions with full listing data and fair rotation';

-- Top spot ads rotation - returns full listing data
CREATE OR REPLACE FUNCTION public.get_rotated_top_spot_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city TEXT,
  district TEXT,
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type TEXT,
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      p.listing_id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'top_spot'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.listing_id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_top_spot_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_top_spot_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_top_spot_ads IS 'Returns top spot promotions with full listing data and fair rotation';

-- Boosted ads rotation - returns full listing data
CREATE OR REPLACE FUNCTION public.get_rotated_boost_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city TEXT,
  district TEXT,
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type TEXT,
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      l.id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'boost'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_boost_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_boost_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_boost_ads IS 'Returns boosted promotions with full listing data and fair rotation';

-- ============================================================================
-- FUNCTION 3: Optimized Bundle Function (No Double JOINs)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_promoted_slots_bundle(
  p_vehicle_type TEXT DEFAULT NULL,
  p_featured_limit INTEGER DEFAULT 2,
  p_top_spot_limit INTEGER DEFAULT 3,
  p_boosted_limit INTEGER DEFAULT 10,
  p_urgent_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  featured_payload JSONB := '[]'::JSONB;
  top_spot_payload JSONB := '[]'::JSONB;
  boosted_payload JSONB := '[]'::JSONB;
  urgent_payload JSONB := '[]'::JSONB;
BEGIN
  -- Featured ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::JSONB)
  INTO featured_payload
  FROM public.get_rotated_featured_ads(p_vehicle_type, p_featured_limit) f;

  -- Top spot ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::JSONB)
  INTO top_spot_payload
  FROM public.get_rotated_top_spot_ads(p_vehicle_type, p_top_spot_limit) t;

  -- Boosted ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(b)), '[]'::JSONB)
  INTO boosted_payload
  FROM public.get_rotated_boost_ads(p_vehicle_type, p_boosted_limit) b;

  -- Urgent ads - direct query with single JOIN
  WITH urgent AS (
    SELECT
      l.id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.listings l
    WHERE l.is_urgent = TRUE
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY COALESCE(l.urgent_until, l.created_at) DESC
    LIMIT p_urgent_limit
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(urgent)), '[]'::JSONB)
  INTO urgent_payload
  FROM urgent;

  RETURN jsonb_build_object(
    'featured', featured_payload,
    'top_spot', top_spot_payload,
    'boosted', boosted_payload,
    'urgent', urgent_payload
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_promoted_slots_bundle IS 'Returns promoted listing slots in single JSON payload (optimized, no double JOINs)';

COMMIT;

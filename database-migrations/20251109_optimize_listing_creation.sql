-- Migration: Optimize listing creation and promoted slot aggregation
-- Created: 2025-11-09
-- Description:
--   * Provide transactional RPC for listing creation with inline duplicate enforcement
--   * Aggregate promoted slot payloads (featured/top/boost/urgent) in a single round-trip
--   * Add supporting index to accelerate active listing feed queries

BEGIN;

-- Atomic listing creation helper used by /api/listings
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

  IF EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.user_id = v_user_id
      AND l.status <> 'deleted'
      AND l.make IS NOT DISTINCT FROM NULLIF(r.make, '')
      AND l.model IS NOT DISTINCT FROM NULLIF(r.model, '')
      AND l.year IS NOT DISTINCT FROM r.year
      AND COALESCE(l.created_at, l.posted_date) >= NOW() - INTERVAL '24 hours'
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
COMMENT ON FUNCTION public.create_listing_v2(JSONB) IS 'Atomically validates, deduplicates, and inserts a listing for the authenticated user';

-- Bundle promoted slots (featured/top/boost/urgent) for listings feed
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
  WITH featured AS (
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
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.get_rotated_featured_ads(p_vehicle_type, p_featured_limit) f
    JOIN public.listings l ON l.id = f.listing_id
    WHERE l.status = 'active' AND l.is_sold = FALSE
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(featured)), '[]'::JSONB)
  INTO featured_payload
  FROM featured;

  WITH top_spot AS (
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
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.get_rotated_top_spot_ads(p_vehicle_type, p_top_spot_limit) t
    JOIN public.listings l ON l.id = t.listing_id
    WHERE l.status = 'active' AND l.is_sold = FALSE
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(top_spot)), '[]'::JSONB)
  INTO top_spot_payload
  FROM top_spot;

  WITH boosted AS (
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
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.get_rotated_boost_ads(p_vehicle_type, p_boosted_limit) b
    JOIN public.listings l ON l.id = b.id
    WHERE l.status = 'active' AND l.is_sold = FALSE
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(boosted)), '[]'::JSONB)
  INTO boosted_payload
  FROM boosted;

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
COMMENT ON FUNCTION public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Returns promoted listing slots in a single JSON payload for the optional vehicle type filter';

-- Index to accelerate active listings feed scans
CREATE INDEX IF NOT EXISTS idx_listings_active_feed
ON public.listings (created_at DESC)
WHERE status = 'active' AND is_sold = FALSE;

COMMIT;


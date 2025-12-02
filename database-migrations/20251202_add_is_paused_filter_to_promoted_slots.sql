-- Add is_paused filter to promoted slots rotation functions
-- Ensures paused listings don't appear in featured/top_spot/boosted/urgent slots

-- Update get_rotated_featured_ads to filter out paused listings
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
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
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
      l.id AS listing_id,
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
      AND COALESCE(l.is_paused, FALSE) = FALSE
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
  FROM candidates c;
END;
$$;

-- Update get_rotated_top_spot_ads to filter out paused listings
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
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
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
      l.id AS listing_id,
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
      AND COALESCE(l.is_paused, FALSE) = FALSE
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
  FROM candidates c;
END;
$$;

-- Update get_rotated_boost_ads to filter out paused listings
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
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
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
      AND COALESCE(l.is_paused, FALSE) = FALSE
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
  FROM candidates c;
END;
$$;

-- Update get_promoted_slots_bundle urgent ads query to filter out paused listings
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

  -- Urgent ads - direct query with is_paused filter
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
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.created_at,
      l.user_id,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.listings l
    WHERE l.is_urgent = TRUE
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND COALESCE(l.is_paused, FALSE) = FALSE
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

-- Add comments
COMMENT ON FUNCTION public.get_rotated_featured_ads IS 'Returns rotated featured ads with is_paused filter';
COMMENT ON FUNCTION public.get_rotated_top_spot_ads IS 'Returns rotated top spot ads with is_paused filter';
COMMENT ON FUNCTION public.get_rotated_boost_ads IS 'Returns rotated boosted ads with is_paused filter';
COMMENT ON FUNCTION public.get_promoted_slots_bundle IS 'Returns all promoted slots with is_paused filter on urgent ads';

-- Migration: Fix promotion rotation system for scalability and fairness
-- Created: 2025-01-20
-- Description: Replace in-memory rotation with database-level RPC functions for better performance and fairness

-- Create function to get rotated boosted ads with fairness guarantees
CREATE OR REPLACE FUNCTION get_rotated_boost_ads(
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
  mileage NUMERIC,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  image_urls TEXT[],
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  promotion_id UUID,
  rotation_score NUMERIC,
  impressions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  promotion_ids UUID[] := '{}';
BEGIN
  -- Get active boosted promotions with fair rotation using FOR UPDATE SKIP LOCKED
  FOR rec IN
    SELECT
      p.id as promotion_id,
      p.rotation_score,
      p.impressions,
      l.*
    FROM promotions p
    INNER JOIN listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'boost'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = false
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY
      -- Prioritize ads that haven't been shown recently
      COALESCE(p.last_shown_at, '1970-01-01'::timestamp) ASC,
      -- Then by lowest impression count
      p.impressions ASC,
      -- Add randomness for fairness
      RANDOM()
    LIMIT p_limit
    FOR UPDATE OF p SKIP LOCKED
  LOOP
    -- Return the listing data
    id := rec.id;
    title := rec.title;
    price := rec.price;
    make := rec.make;
    model := rec.model;
    year := rec.year;
    mileage := rec.mileage;
    fuel_type := rec.fuel_type;
    transmission := rec.transmission;
    location := rec.location;
    image_urls := rec.image_urls;
    phone := rec.phone;
    whatsapp := rec.whatsapp;
    email := rec.email;
    promotion_id := rec.promotion_id;
    rotation_score := rec.rotation_score;
    impressions := rec.impressions;

    -- Track promotion ID for batch update
    promotion_ids := promotion_ids || rec.promotion_id;

    RETURN NEXT;
  END LOOP;

  -- Update impression counts and last_shown_at for selected promotions
  IF array_length(promotion_ids, 1) > 0 THEN
    UPDATE promotions
    SET
      impressions = impressions + 1,
      last_shown_at = NOW(),
      rotation_score = rotation_score + 1
    WHERE id = ANY(promotion_ids);
  END IF;

  RETURN;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION get_rotated_boost_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_rotated_boost_ads(TEXT, INTEGER) TO authenticated;

-- Add index for boosted ads rotation performance
CREATE INDEX IF NOT EXISTS idx_promotions_boost_rotation
ON promotions (promotion_type, is_active, expires_at, last_shown_at, impressions)
WHERE promotion_type = 'boost';

-- Comment the migration
COMMENT ON FUNCTION get_rotated_boost_ads IS 'Get boosted promotions with fair rotation and automatic impression tracking';
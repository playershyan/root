-- Add rotation tracking columns to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS rotation_score INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS last_shown_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS rotation_group VARCHAR(50); -- For grouping by time slots

-- Create rotation tracking table for fair distribution
CREATE TABLE IF NOT EXISTS promotion_rotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  promotion_type VARCHAR(50) NOT NULL,
  rotation_slot INTEGER NOT NULL, -- Position in rotation (1, 2, 3, etc.)
  rotation_cycle INTEGER DEFAULT 0, -- Current cycle number
  impressions_in_cycle INTEGER DEFAULT 0,
  last_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick rotation lookups
CREATE INDEX idx_rotation_type_slot ON promotion_rotations(promotion_type, rotation_slot);
CREATE INDEX idx_rotation_cycle ON promotion_rotations(rotation_cycle, promotion_type);
CREATE INDEX idx_rotation_last ON promotion_rotations(last_rotated_at);

-- Function to get next set of featured ads with fair rotation
CREATE OR REPLACE FUNCTION get_rotated_featured_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
) AS $$
DECLARE
  v_total_featured INTEGER;
  v_rotation_interval INTERVAL := '1 hour'::INTERVAL; -- Rotate every hour
BEGIN
  -- Count total active featured ads
  SELECT COUNT(*) INTO v_total_featured
  FROM promotions p
  JOIN listings l ON l.id = p.listing_id
  WHERE p.promotion_type = 'featured'
    AND p.is_active = true
    AND p.expires_at > NOW()
    AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type);

  -- If less than or equal to limit, return all
  IF v_total_featured <= p_limit THEN
    RETURN QUERY
    SELECT p.listing_id, p.id, p.rotation_score, p.impressions
    FROM promotions p
    JOIN listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Use rotation algorithm for fair distribution
    RETURN QUERY
    WITH ranked_ads AS (
      SELECT 
        p.listing_id,
        p.id as promotion_id,
        p.rotation_score,
        p.impressions,
        p.last_shown_at,
        -- Calculate priority score based on:
        -- 1. Time since last shown (higher priority if not shown recently)
        -- 2. Impression count (lower impressions = higher priority)
        -- 3. Random factor for fairness
        (
          EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_shown_at, '2000-01-01'::TIMESTAMP))) / 3600 -- Hours since last shown
          - (p.impressions * 0.1) -- Penalty for high impressions
          + (RANDOM() * 10) -- Random factor
        ) as priority_score
      FROM promotions p
      JOIN listings l ON l.id = p.listing_id
      WHERE p.promotion_type = 'featured'
        AND p.is_active = true
        AND p.expires_at > NOW()
        AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    )
    SELECT 
      listing_id,
      promotion_id,
      rotation_score,
      impressions
    FROM ranked_ads
    ORDER BY priority_score DESC
    LIMIT p_limit;
  END IF;

  -- Update last_shown_at and impressions for returned ads
  UPDATE promotions
  SET 
    last_shown_at = NOW(),
    impressions = impressions + 1,
    rotation_score = rotation_score + 1
  WHERE id IN (
    SELECT promotion_id FROM get_rotated_featured_ads
  );
END;
$$ LANGUAGE plpgsql;

-- Similar function for Top Spot rotation
CREATE OR REPLACE FUNCTION get_rotated_top_spot_ads(
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  promotion_id UUID,
  rotation_score INTEGER,
  impressions INTEGER
) AS $$
DECLARE
  v_total_top_spot INTEGER;
BEGIN
  -- Count total active top spot ads
  SELECT COUNT(*) INTO v_total_top_spot
  FROM promotions p
  JOIN listings l ON l.id = p.listing_id
  WHERE p.promotion_type = 'top_spot'
    AND p.is_active = true
    AND p.expires_at > NOW()
    AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type);

  -- If less than or equal to limit, return all
  IF v_total_top_spot <= p_limit THEN
    RETURN QUERY
    SELECT p.listing_id, p.id, p.rotation_score, p.impressions
    FROM promotions p
    JOIN listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'top_spot'
      AND p.is_active = true
      AND p.expires_at > NOW()
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Use rotation algorithm
    RETURN QUERY
    WITH ranked_ads AS (
      SELECT 
        p.listing_id,
        p.id as promotion_id,
        p.rotation_score,
        p.impressions,
        p.last_shown_at,
        (
          EXTRACT(EPOCH FROM (NOW() - COALESCE(p.last_shown_at, '2000-01-01'::TIMESTAMP))) / 3600
          - (p.impressions * 0.1)
          + (RANDOM() * 10)
        ) as priority_score
      FROM promotions p
      JOIN listings l ON l.id = p.listing_id
      WHERE p.promotion_type = 'top_spot'
        AND p.is_active = true
        AND p.expires_at > NOW()
        AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    )
    SELECT 
      listing_id,
      promotion_id,
      rotation_score,
      impressions
    FROM ranked_ads
    ORDER BY priority_score DESC
    LIMIT p_limit;
  END IF;

  -- Update metrics
  UPDATE promotions
  SET 
    last_shown_at = NOW(),
    impressions = impressions + 1,
    rotation_score = rotation_score + 1
  WHERE id IN (
    SELECT promotion_id FROM get_rotated_top_spot_ads
  );
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily rotation scores (call at midnight)
CREATE OR REPLACE FUNCTION reset_daily_rotation_scores()
RETURNS void AS $$
BEGIN
  -- Reset rotation scores but keep impression counts
  UPDATE promotions
  SET rotation_score = 0
  WHERE is_active = true
    AND expires_at > NOW();
    
  -- Log rotation cycle
  INSERT INTO promotion_rotations (promotion_id, listing_id, promotion_type, rotation_slot, rotation_cycle)
  SELECT 
    p.id,
    p.listing_id,
    p.promotion_type,
    ROW_NUMBER() OVER (PARTITION BY p.promotion_type ORDER BY p.impressions ASC),
    EXTRACT(DOY FROM NOW())::INTEGER
  FROM promotions p
  WHERE p.is_active = true
    AND p.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Create view for rotation analytics
CREATE OR REPLACE VIEW promotion_rotation_stats AS
SELECT 
  p.id,
  p.listing_id,
  p.promotion_type,
  p.impressions,
  p.rotation_score,
  p.last_shown_at,
  l.title,
  l.vehicle_type,
  CASE 
    WHEN p.last_shown_at IS NULL THEN 'Never shown'
    WHEN p.last_shown_at > NOW() - INTERVAL '1 hour' THEN 'Shown recently'
    WHEN p.last_shown_at > NOW() - INTERVAL '6 hours' THEN 'Shown today'
    ELSE 'Not shown recently'
  END as show_status,
  p.impressions::FLOAT / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1) as avg_daily_impressions
FROM promotions p
JOIN listings l ON l.id = p.listing_id
WHERE p.is_active = true
  AND p.expires_at > NOW()
ORDER BY p.promotion_type, p.impressions ASC;
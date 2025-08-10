-- Migration: Create Promotion Functions and Triggers
-- Run this after 001_create_promotions_tables.sql

-- Function to update listing promotion flags based on active promotions
CREATE OR REPLACE FUNCTION update_listing_promotions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the listing's promotion flags
  UPDATE listings
  SET 
    is_featured = EXISTS (
      SELECT 1 FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'featured' 
      AND is_active = true 
      AND expires_at > NOW()
    ),
    is_top_spot = EXISTS (
      SELECT 1 FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'top_spot' 
      AND is_active = true 
      AND expires_at > NOW()
    ),
    is_boosted = EXISTS (
      SELECT 1 FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'boost' 
      AND is_active = true 
      AND expires_at > NOW()
    ),
    is_urgent = EXISTS (
      SELECT 1 FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'urgent' 
      AND is_active = true 
      AND expires_at > NOW()
    ),
    featured_until = (
      SELECT MAX(expires_at) FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'featured' 
      AND is_active = true
    ),
    top_spot_until = (
      SELECT MAX(expires_at) FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'top_spot' 
      AND is_active = true
    ),
    boosted_until = (
      SELECT MAX(expires_at) FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'boost' 
      AND is_active = true
    ),
    urgent_until = (
      SELECT MAX(expires_at) FROM promotions 
      WHERE listing_id = NEW.listing_id 
      AND promotion_type = 'urgent' 
      AND is_active = true
    )
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update listing when promotion is added or updated
DROP TRIGGER IF EXISTS update_listing_on_promotion ON promotions;
CREATE TRIGGER update_listing_on_promotion
AFTER INSERT OR UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_listing_promotions();

-- Function to expire promotions (to be called by cron job)
CREATE OR REPLACE FUNCTION expire_promotions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mark expired promotions as inactive
  UPDATE promotions
  SET is_active = false
  WHERE is_active = true
  AND expires_at <= NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Update listing flags for expired promotions
  UPDATE listings l
  SET 
    is_featured = false,
    featured_until = NULL
  WHERE is_featured = true
  AND (featured_until IS NULL OR featured_until <= NOW())
  AND NOT EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.listing_id = l.id
    AND p.promotion_type = 'featured'
    AND p.is_active = true
    AND p.expires_at > NOW()
  );
  
  UPDATE listings l
  SET 
    is_top_spot = false,
    top_spot_until = NULL
  WHERE is_top_spot = true
  AND (top_spot_until IS NULL OR top_spot_until <= NOW())
  AND NOT EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.listing_id = l.id
    AND p.promotion_type = 'top_spot'
    AND p.is_active = true
    AND p.expires_at > NOW()
  );
  
  UPDATE listings l
  SET 
    is_boosted = false,
    boosted_until = NULL,
    boost_score = 0
  WHERE is_boosted = true
  AND (boosted_until IS NULL OR boosted_until <= NOW())
  AND NOT EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.listing_id = l.id
    AND p.promotion_type = 'boost'
    AND p.is_active = true
    AND p.expires_at > NOW()
  );
  
  UPDATE listings l
  SET 
    is_urgent = false,
    urgent_until = NULL
  WHERE is_urgent = true
  AND (urgent_until IS NULL OR urgent_until <= NOW())
  AND NOT EXISTS (
    SELECT 1 FROM promotions p
    WHERE p.listing_id = l.id
    AND p.promotion_type = 'urgent'
    AND p.is_active = true
    AND p.expires_at > NOW()
  );
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to apply daily boost (resets boost score daily)
CREATE OR REPLACE FUNCTION apply_daily_boost()
RETURNS INTEGER AS $$
DECLARE
  boosted_count INTEGER;
BEGIN
  -- Reset boost scores for all boosted listings
  UPDATE listings
  SET boost_score = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE is_boosted = true
  AND boosted_until > NOW();
  
  GET DIAGNOSTICS boosted_count = ROW_COUNT;
  
  -- Update last_boosted_at in promotions table
  UPDATE promotions
  SET last_boosted_at = NOW()
  WHERE promotion_type = 'boost'
  AND is_active = true
  AND expires_at > NOW();
  
  RETURN boosted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to reset daily rotation scores (call at midnight)
CREATE OR REPLACE FUNCTION reset_daily_rotation_scores()
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  -- Reset rotation scores but keep impression counts
  UPDATE promotions
  SET rotation_score = 0
  WHERE is_active = true
    AND expires_at > NOW();
    
  GET DIAGNOSTICS reset_count = ROW_COUNT;
    
  -- Log rotation cycle
  INSERT INTO promotion_rotations (promotion_id, listing_id, promotion_type, rotation_slot, rotation_cycle)
  SELECT 
    p.id,
    p.listing_id,
    p.promotion_type,
    ROW_NUMBER() OVER (PARTITION BY p.promotion_type ORDER BY p.impressions ASC, p.created_at ASC),
    EXTRACT(DOY FROM NOW())::INTEGER -- Day of year as cycle number
  FROM promotions p
  WHERE p.is_active = true
    AND p.expires_at > NOW()
  ON CONFLICT DO NOTHING; -- Prevent duplicate entries
  
  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;
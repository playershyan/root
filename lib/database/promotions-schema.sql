-- Promotions table to track all paid features for listings
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  promotion_type VARCHAR(50) NOT NULL, -- 'featured', 'top_spot', 'boost', 'urgent'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_boosted_at TIMESTAMP WITH TIME ZONE, -- For daily boost tracking
  payment_id UUID, -- Reference to payment transaction
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, expires_at);
CREATE INDEX idx_promotions_type ON promotions(promotion_type, is_active);
CREATE INDEX idx_promotions_expires ON promotions(expires_at);

-- Add promotion columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_top_spot BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0; -- For sorting boosted ads
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS top_spot_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS urgent_until TIMESTAMP WITH TIME ZONE;

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
CREATE TRIGGER update_listing_on_promotion
AFTER INSERT OR UPDATE ON promotions
FOR EACH ROW
EXECUTE FUNCTION update_listing_promotions();

-- Function to expire promotions (to be called by cron job)
CREATE OR REPLACE FUNCTION expire_promotions()
RETURNS void AS $$
BEGIN
  -- Mark expired promotions as inactive
  UPDATE promotions
  SET is_active = false
  WHERE is_active = true
  AND expires_at <= NOW();
  
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
END;
$$ LANGUAGE plpgsql;

-- Function to apply daily boost (resets boost score daily)
CREATE OR REPLACE FUNCTION apply_daily_boost()
RETURNS void AS $$
BEGIN
  -- Reset boost scores for all boosted listings
  UPDATE listings
  SET boost_score = EXTRACT(EPOCH FROM NOW())::INTEGER
  WHERE is_boosted = true
  AND boosted_until > NOW();
  
  -- Update last_boosted_at in promotions table
  UPDATE promotions
  SET last_boosted_at = NOW()
  WHERE promotion_type = 'boost'
  AND is_active = true
  AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;
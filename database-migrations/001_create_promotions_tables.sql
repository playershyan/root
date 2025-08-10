-- Migration: Create Promotions and Rotation Tables
-- Run this after your main database is set up

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL,
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN ('featured', 'top_spot', 'boost', 'urgent')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_boosted_at TIMESTAMP WITH TIME ZONE,
  payment_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  -- Rotation tracking columns
  rotation_score INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  last_shown_at TIMESTAMP WITH TIME ZONE,
  rotation_group VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for promotions table
CREATE INDEX idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, expires_at);
CREATE INDEX idx_promotions_type ON promotions(promotion_type, is_active);
CREATE INDEX idx_promotions_expires ON promotions(expires_at);
CREATE INDEX idx_promotions_rotation ON promotions(promotion_type, rotation_score DESC, last_shown_at ASC);
CREATE INDEX idx_promotions_impressions ON promotions(promotion_type, impressions ASC);

-- Create promotion rotations tracking table
CREATE TABLE IF NOT EXISTS promotion_rotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  promotion_type VARCHAR(50) NOT NULL,
  rotation_slot INTEGER NOT NULL,
  rotation_cycle INTEGER DEFAULT 0,
  impressions_in_cycle INTEGER DEFAULT 0,
  last_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for rotation tracking
CREATE INDEX idx_rotation_type_slot ON promotion_rotations(promotion_type, rotation_slot);
CREATE INDEX idx_rotation_cycle ON promotion_rotations(rotation_cycle, promotion_type);
CREATE INDEX idx_rotation_last ON promotion_rotations(last_rotated_at);

-- Add promotion columns to listings table (modify existing table)
-- Note: Run these one by one and check if columns already exist
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_top_spot BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS top_spot_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS urgent_until TIMESTAMP WITH TIME ZONE;

-- Add indexes for promoted listings
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_listings_top_spot ON listings(is_top_spot, top_spot_until);
CREATE INDEX IF NOT EXISTS idx_listings_boosted ON listings(is_boosted, boost_score DESC);
CREATE INDEX IF NOT EXISTS idx_listings_urgent ON listings(is_urgent, urgent_until);
CREATE INDEX IF NOT EXISTS idx_listings_promotions ON listings(is_featured DESC, is_top_spot DESC, is_boosted DESC, boost_score DESC, created_at DESC);

-- Add foreign key constraint (if listings table exists)
-- ALTER TABLE promotions ADD CONSTRAINT fk_promotions_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE;

-- Create updated_at trigger for promotions table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotions_updated_at 
BEFORE UPDATE ON promotions 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data if needed (optional)
-- INSERT INTO promotions (listing_id, promotion_type, expires_at, amount) VALUES ...;
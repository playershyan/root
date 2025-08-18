-- Create listings table for vehicle advertisements
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic listing information
  title VARCHAR(255) NOT NULL,
  details TEXT,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  negotiable BOOLEAN DEFAULT true,
  
  -- Vehicle details
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  mileage INTEGER,
  fuel_type VARCHAR(50),
  transmission VARCHAR(50),
  body_type VARCHAR(50),
  color VARCHAR(50),
  engine_capacity INTEGER,
  
  -- Listing status and metadata
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'sold', 'expired', 'deleted')),
  views INTEGER DEFAULT 0,
  
  -- Location
  location VARCHAR(255),
  city VARCHAR(100),
  district VARCHAR(100),
  
  -- Images (storing URLs or references)
  images JSONB DEFAULT '[]'::jsonb,
  primary_image_url TEXT,
  
  -- Timestamps
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sold_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Promotion flags (will be managed by promotions table)
  is_featured BOOLEAN DEFAULT false,
  is_top_spot BOOLEAN DEFAULT false,
  is_boosted BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  boost_score INTEGER DEFAULT 0,
  featured_until TIMESTAMP WITH TIME ZONE,
  top_spot_until TIMESTAMP WITH TIME ZONE,
  boosted_until TIMESTAMP WITH TIME ZONE,
  urgent_until TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_status_posted ON listings(status, posted_date DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_location ON listings(city, district);
CREATE INDEX idx_listings_make_model ON listings(make, model);
CREATE INDEX idx_listings_year ON listings(year);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- If status changes to 'sold', set sold_date
    IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
        NEW.sold_date = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_listings_timestamp
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_listings_updated_at();

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all active listings
CREATE POLICY "Active listings are viewable by everyone" ON listings
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

-- Users can insert their own listings
CREATE POLICY "Users can insert own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);
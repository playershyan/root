-- Similar listings lookup optimization
-- Note: CONCURRENTLY cannot be used in transactions, removed for MCP compatibility
CREATE INDEX IF NOT EXISTS idx_listings_similar_lookup
ON listings (make, model, year, status, is_sold, is_paused, created_at DESC)
WHERE status = 'active' AND is_sold = false AND is_paused = false;

-- Price range index for faster filtering
CREATE INDEX IF NOT EXISTS idx_listings_price_active
ON listings (price)
WHERE status = 'active' AND is_sold = false;

-- Similar listings RPC function for optimized filtering
CREATE OR REPLACE FUNCTION get_similar_listings(
  p_listing_id UUID,
  p_make TEXT,
  p_model TEXT,
  p_year INTEGER,
  p_price NUMERIC,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  image_url TEXT,
  primary_image_url TEXT,
  location TEXT,
  pricing_type VARCHAR(20),
  finance_type VARCHAR(100),
  outstanding_balance NUMERIC,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.make,
    l.model,
    l.year,
    l.mileage,
    l.fuel_type,
    l.transmission,
    l.image_url,
    l.primary_image_url,
    l.location,
    l.pricing_type,
    l.finance_type,
    l.outstanding_balance,
    l.is_featured,
    l.is_top_spot
  FROM listings l
  WHERE l.id != p_listing_id
    AND l.make = p_make
    AND l.model = p_model
    AND l.year BETWEEN (p_year - 3) AND (p_year + 3)
    AND l.price BETWEEN (p_price * 0.9) AND (p_price * 1.1)
    AND l.status = 'active'
    AND l.is_sold = false
    AND l.is_paused = false
    AND (
      l.pricing_type != 'finance'
      OR l.finance_type != 'transfer'
      OR l.outstanding_balance IS NOT NULL
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;


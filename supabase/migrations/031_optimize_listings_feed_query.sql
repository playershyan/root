-- Optimize /listings page query performance
-- Addresses 2-3 second delay when navigating to Browse Vehicles page

-- Problem: The listings feed query filters by status='active' AND is_sold=false
-- but there's no composite index for this common query pattern.

-- Add partial index for active, unsold listings (most common query)
CREATE INDEX IF NOT EXISTS idx_listings_active_unsold_recent 
ON public.listings (created_at DESC, boost_score DESC) 
WHERE status = 'active' AND is_sold = false;

-- Add index for vehicle_type filtering (used in promoted slots)
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type_active 
ON public.listings (vehicle_type, status, is_sold, created_at DESC) 
WHERE status = 'active' AND is_sold = false;

-- Optimize urgent listings query (used in get_promoted_slots_bundle)
CREATE INDEX IF NOT EXISTS idx_listings_urgent_active 
ON public.listings (is_urgent, urgent_until DESC, created_at DESC) 
WHERE status = 'active' AND is_sold = false AND is_urgent = true;

-- Optimize featured listings query
CREATE INDEX IF NOT EXISTS idx_listings_featured_active_lookup
ON public.listings (is_featured, created_at DESC)
WHERE status = 'active' AND is_sold = false AND is_featured = true;

-- Optimize boosted listings query
CREATE INDEX IF NOT EXISTS idx_listings_boosted_active_lookup
ON public.listings (is_boosted, boost_score DESC, created_at DESC)
WHERE status = 'active' AND is_sold = false AND is_boosted = true;

-- Optimize top_spot listings query
CREATE INDEX IF NOT EXISTS idx_listings_top_spot_active_lookup
ON public.listings (is_top_spot, created_at DESC)
WHERE status = 'active' AND is_sold = false AND is_top_spot = true;

-- Add index for filtering by make/model on active listings
CREATE INDEX IF NOT EXISTS idx_listings_make_model_active
ON public.listings (make, model, status, is_sold, created_at DESC)
WHERE status = 'active' AND is_sold = false;

-- Add index for price range filtering on active listings
CREATE INDEX IF NOT EXISTS idx_listings_price_active
ON public.listings (price, created_at DESC)
WHERE status = 'active' AND is_sold = false;

-- Add index for year filtering on active listings
CREATE INDEX IF NOT EXISTS idx_listings_year_active
ON public.listings (year DESC, created_at DESC)
WHERE status = 'active' AND is_sold = false;

-- Add index for location filtering on active listings  
CREATE INDEX IF NOT EXISTS idx_listings_location_active
ON public.listings (city, district, status, is_sold, created_at DESC)
WHERE status = 'active' AND is_sold = false;

-- Add comment
COMMENT ON INDEX idx_listings_active_unsold_recent IS 'Optimizes main listings feed query - fixes 2-3s delay on Browse Vehicles page';
COMMENT ON INDEX idx_listings_vehicle_type_active IS 'Optimizes vehicle type filtering in listings feed';
COMMENT ON INDEX idx_listings_urgent_active IS 'Optimizes urgent listings query in promoted slots';

-- Analyze tables to update statistics
ANALYZE public.listings;
ANALYZE public.promotions;


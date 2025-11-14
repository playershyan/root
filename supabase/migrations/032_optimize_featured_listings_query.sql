-- Migration: Optimize Featured Listings Query Performance
-- Date: 2025-11-14
-- Purpose: Add optimized index for featured listings query on home page

-- Add index for featured listings query
-- This index speeds up queries filtering by is_featured=true and status='active'
-- and ordering by created_at DESC
CREATE INDEX IF NOT EXISTS idx_listings_featured_active 
ON listings (created_at DESC) 
WHERE is_featured = true AND status = 'active';

-- Add comment explaining the index
COMMENT ON INDEX idx_listings_featured_active IS 
'Optimizes featured listings query on home page - filters by is_featured=true and status=active, orders by created_at';

-- Verify the index was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_listings_featured_active'
    ) THEN
        RAISE NOTICE 'Index idx_listings_featured_active created successfully';
    ELSE
        RAISE EXCEPTION 'Index idx_listings_featured_active was not created';
    END IF;
END $$;


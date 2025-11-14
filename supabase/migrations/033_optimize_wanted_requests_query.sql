-- Migration: Optimize Wanted Requests Query Performance
-- Date: 2025-11-14
-- Purpose: Add database indexes and schema fixes for /wanted page performance

-- ========================================
-- PART 1: Schema Verification & Fix
-- ========================================

-- Check if is_active column exists, if not add it
-- This column may have been missing from the original schema
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'wanted_requests' 
          AND column_name = 'is_active'
    ) THEN
        -- Add is_active column with default value
        ALTER TABLE wanted_requests 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Set existing records to active
        UPDATE wanted_requests 
        SET is_active = true 
        WHERE is_active IS NULL;
        
        RAISE NOTICE 'Added is_active column to wanted_requests table';
    ELSE
        RAISE NOTICE 'is_active column already exists on wanted_requests table';
    END IF;
END $$;

-- Add created_at column if missing (should exist from original migration)
ALTER TABLE wanted_requests 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add high priority promotion fields (similar to listings)
ALTER TABLE wanted_requests 
ADD COLUMN IF NOT EXISTS is_high_priority BOOLEAN DEFAULT false;

ALTER TABLE wanted_requests 
ADD COLUMN IF NOT EXISTS high_priority_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE wanted_requests 
ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;

-- ========================================
-- PART 2: Performance Indexes
-- ========================================

-- Main query index: status='active' AND is_active=true ORDER BY created_at DESC
-- This is a partial index (filtered) for maximum efficiency
CREATE INDEX IF NOT EXISTS idx_wanted_requests_active_recent 
ON wanted_requests (created_at DESC) 
WHERE status = 'active' AND is_active = true;

-- Alternative index if is_active is always true
CREATE INDEX IF NOT EXISTS idx_wanted_requests_status_recent 
ON wanted_requests (status, created_at DESC);

-- Index for high priority wanted requests
CREATE INDEX IF NOT EXISTS idx_wanted_requests_high_priority 
ON wanted_requests (created_at DESC) 
WHERE is_high_priority = true AND status = 'active' AND is_active = true;

-- Index for user's wanted requests (profile page)
CREATE INDEX IF NOT EXISTS idx_wanted_requests_user_status 
ON wanted_requests (user_id, status, created_at DESC);

-- ========================================
-- PART 3: Join Optimization Indexes
-- ========================================

-- Ensure profiles table has proper index for joins
CREATE INDEX IF NOT EXISTS idx_profiles_id 
ON profiles(id);

-- Business profiles index for joins (if not already exists)
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id 
ON business_profiles(user_id) 
WHERE is_active = true;

-- ========================================
-- PART 4: Additional Filters
-- ========================================

-- Index for make/model filtering
CREATE INDEX IF NOT EXISTS idx_wanted_requests_make_model 
ON wanted_requests (make, model, created_at DESC) 
WHERE status = 'active' AND is_active = true;

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_wanted_requests_location 
ON wanted_requests (location, created_at DESC) 
WHERE status = 'active' AND is_active = true;

-- Index for budget range queries
CREATE INDEX IF NOT EXISTS idx_wanted_requests_budget 
ON wanted_requests (min_budget, max_budget, created_at DESC) 
WHERE status = 'active' AND is_active = true;

-- ========================================
-- PART 5: Verification
-- ========================================

-- Verify all indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'wanted_requests' 
      AND schemaname = 'public'
      AND indexname LIKE 'idx_wanted%';
    
    IF index_count >= 8 THEN
        RAISE NOTICE 'Successfully created % indexes on wanted_requests table', index_count;
    ELSE
        RAISE WARNING 'Expected at least 8 indexes, but only found %', index_count;
    END IF;
END $$;

-- Display all indexes on wanted_requests for verification
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'wanted_requests' 
  AND schemaname = 'public'
ORDER BY indexname;

-- ========================================
-- PART 6: Analyze Table
-- ========================================

-- Update table statistics for query planner
ANALYZE wanted_requests;
ANALYZE profiles;
ANALYZE business_profiles;

-- Add comments for documentation
COMMENT ON INDEX idx_wanted_requests_active_recent IS 
'Optimizes main /wanted page query: status=active AND is_active=true ORDER BY created_at DESC';

COMMENT ON INDEX idx_wanted_requests_high_priority IS 
'Optimizes high priority wanted requests filtering';

COMMENT ON INDEX idx_wanted_requests_user_status IS 
'Optimizes user profile page wanted requests query';


-- Migration: Fix wanted_requests is_active state inconsistencies
-- Date: 2025-01-XX
-- Purpose: Ensure all wanted_requests with status='active' have is_active=true
--          This fixes the issue where active wanted requests don't appear on /wanted page

BEGIN;

-- Fix any records where status='active' but is_active is false or NULL
UPDATE wanted_requests
SET is_active = true
WHERE status = 'active' 
  AND (is_active = false OR is_active IS NULL);

-- Fix any records where status != 'active' but is_active is true
UPDATE wanted_requests
SET is_active = false
WHERE status != 'active' 
  AND is_active = true;

-- Verify the fix
DO $$
DECLARE
    inconsistent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inconsistent_count
    FROM wanted_requests
    WHERE (status = 'active' AND (is_active = false OR is_active IS NULL))
       OR (status != 'active' AND is_active = true);
    
    IF inconsistent_count > 0 THEN
        RAISE WARNING 'Found % wanted requests with inconsistent status/is_active state after fix', inconsistent_count;
    ELSE
        RAISE NOTICE 'All wanted requests now have consistent status/is_active state';
    END IF;
END $$;

COMMIT;


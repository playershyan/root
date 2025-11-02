-- Fix urgency field default value
-- Current: ALL wanted requests default to urgency='high'
-- Expected: Only paid high-priority requests should show urgent styling

-- Change urgency default from 'high' to NULL
ALTER TABLE wanted_requests
  ALTER COLUMN urgency DROP DEFAULT;

-- Update existing records that have urgency='high' but is_high_priority=false to NULL
-- (These were auto-set by the incorrect default, not user-selected)
UPDATE wanted_requests
SET urgency = NULL
WHERE urgency = 'high'
  AND (is_high_priority = false OR is_high_priority IS NULL);

-- Add comment explaining the field
COMMENT ON COLUMN wanted_requests.urgency IS 'Optional urgency level set by user (not used for display priority - see is_high_priority instead)';

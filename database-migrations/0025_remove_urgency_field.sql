-- Remove redundant urgency field
-- Consolidate to single priority system using is_high_priority only

-- Drop urgency column
ALTER TABLE wanted_requests
  DROP COLUMN IF EXISTS urgency;

-- Ensure is_high_priority has correct default
ALTER TABLE wanted_requests
  ALTER COLUMN is_high_priority SET DEFAULT false;

-- Update comment on is_high_priority
COMMENT ON COLUMN wanted_requests.is_high_priority IS 'Paid promotion flag - determines if request shows as urgent/highlighted (true) or regular (false)';

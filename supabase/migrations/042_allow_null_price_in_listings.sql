-- Allow NULL values in price column for listings
-- This enables "Price on Request" functionality for certain users

ALTER TABLE listings
ALTER COLUMN price DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN listings.price IS 'Vehicle price in decimal format. NULL indicates "Price on Request"';

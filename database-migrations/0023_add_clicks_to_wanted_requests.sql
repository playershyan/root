-- Add clicks tracking column to wanted_requests table
-- This tracks how many times the "Respond to Request" button is clicked

ALTER TABLE wanted_requests ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;

-- Add index for performance when sorting by clicks
CREATE INDEX IF NOT EXISTS idx_wanted_requests_clicks ON wanted_requests(clicks);

-- Add comment
COMMENT ON COLUMN wanted_requests.clicks IS 'Number of times the Respond to Request button has been clicked';

-- Create function to increment clicks count
CREATE OR REPLACE FUNCTION increment_wanted_request_clicks(request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wanted_requests
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = request_id;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION increment_wanted_request_clicks IS 'Increments the clicks counter for a wanted request';

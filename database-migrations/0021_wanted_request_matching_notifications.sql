-- Migration: Add wanted request matching notifications system
-- Description: Adds table and columns to track when approved listings match wanted requests

-- Add new columns to wanted_requests table for tracking match notifications
ALTER TABLE wanted_requests ADD COLUMN IF NOT EXISTS new_matches_count INTEGER DEFAULT 0;
ALTER TABLE wanted_requests ADD COLUMN IF NOT EXISTS last_match_notification TIMESTAMP WITH TIME ZONE;

-- Create table to track listing-to-wanted-request match notifications
CREATE TABLE IF NOT EXISTS listing_wanted_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  wanted_request_ids UUID[] NOT NULL,
  match_count INTEGER NOT NULL,
  listing_make TEXT NOT NULL,
  listing_model TEXT NOT NULL,
  listing_year INTEGER NOT NULL,
  listing_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_by UUID REFERENCES auth.users(id)
);

-- Create index for efficient querying of active notifications
CREATE INDEX IF NOT EXISTS idx_listing_wanted_notifications_active
ON listing_wanted_notifications (dismissed_at)
WHERE dismissed_at IS NULL;

-- Create index for listing_id lookups
CREATE INDEX IF NOT EXISTS idx_listing_wanted_notifications_listing_id
ON listing_wanted_notifications (listing_id);

-- Create index for efficient querying by creation date
CREATE INDEX IF NOT EXISTS idx_listing_wanted_notifications_created_at
ON listing_wanted_notifications (created_at DESC);

-- Enable RLS on the new table
ALTER TABLE listing_wanted_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reading notifications (public access for displaying banners)
CREATE POLICY "Anyone can read active notifications" ON listing_wanted_notifications
FOR SELECT USING (dismissed_at IS NULL);

-- Create RLS policy for dismissing notifications (only authenticated users can dismiss)
CREATE POLICY "Authenticated users can dismiss notifications" ON listing_wanted_notifications
FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policy for inserting notifications (only service role can insert)
CREATE POLICY "Service role can insert notifications" ON listing_wanted_notifications
FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create function to clean up old dismissed notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_dismissed_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM listing_wanted_notifications
  WHERE dismissed_at IS NOT NULL
    AND dismissed_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create function to get active notification count for header badge
CREATE OR REPLACE FUNCTION get_active_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO notification_count
  FROM listing_wanted_notifications
  WHERE dismissed_at IS NULL;

  RETURN notification_count;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION cleanup_old_dismissed_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_notification_count() TO authenticated, anon;
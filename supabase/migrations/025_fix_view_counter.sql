-- Migration to fix view counter issues
-- 1. Create atomic view increment function
-- 2. Add view tracking for rate limiting

-- Create view tracking table for rate limiting
CREATE TABLE IF NOT EXISTS listing_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  viewer_ip INET,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_id ON listing_views(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_views_ip_time ON listing_views(viewer_ip, viewed_at);
CREATE INDEX IF NOT EXISTS idx_listing_views_user_time ON listing_views(user_id, viewed_at);

-- Create atomic view increment function with rate limiting
CREATE OR REPLACE FUNCTION increment_listing_views(
  listing_id UUID,
  viewer_ip INET DEFAULT NULL,
  viewer_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_view_count INTEGER;
  listing_owner_id UUID;
BEGIN
  -- Get listing owner to prevent self-views
  SELECT user_id INTO listing_owner_id 
  FROM listings 
  WHERE id = listing_id;
  
  -- Don't increment if viewer is the owner
  IF viewer_user_id IS NOT NULL AND viewer_user_id = listing_owner_id THEN
    RETURN FALSE;
  END IF;
  
  -- Rate limiting: Check for recent views from same IP or user (within 1 hour)
  SELECT COUNT(*) INTO recent_view_count
  FROM listing_views
  WHERE listing_views.listing_id = increment_listing_views.listing_id
    AND listing_views.viewed_at > NOW() - INTERVAL '1 hour'
    AND (
      (viewer_ip IS NOT NULL AND listing_views.viewer_ip = viewer_ip) OR
      (viewer_user_id IS NOT NULL AND listing_views.user_id = viewer_user_id)
    );
  
  -- Allow max 3 views per hour from same source
  IF recent_view_count >= 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Record the view
  INSERT INTO listing_views (listing_id, viewer_ip, user_id)
  VALUES (listing_id, viewer_ip, viewer_user_id);
  
  -- Atomically increment the view count
  UPDATE listings 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = listing_id;
  
  RETURN TRUE;
END;
$$;

-- Create simplified version for backward compatibility
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple atomic increment without rate limiting for backward compatibility
  UPDATE listings 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = listing_id;
  
  RETURN TRUE;
END;
$$;

-- Enable RLS on listing_views table
ALTER TABLE listing_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for listing_views
CREATE POLICY "Anyone can insert listing views" ON listing_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own listing views" ON listing_views
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view all listing views (assuming admin function exists)
CREATE POLICY "Admins can view all listing views" ON listing_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
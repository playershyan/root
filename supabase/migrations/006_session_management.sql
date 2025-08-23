-- Session Management System Migration
-- This creates tables and functions for tracking user sessions

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  location_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  revoked_at TIMESTAMPTZ NULL,
  revoked_by UUID NULL REFERENCES auth.users(id),
  revoke_reason TEXT NULL,
  
  -- Indexes for performance
  CONSTRAINT unique_session_token UNIQUE (session_token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create session_activity table for audit logging
CREATE TABLE IF NOT EXISTS session_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'refresh', 'revoke', 'expire'
  ip_address INET,
  user_agent TEXT,
  location_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for session activity
CREATE INDEX IF NOT EXISTS idx_session_activity_user_id ON session_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_session_id ON session_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_session_activity_type ON session_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_session_activity_created_at ON session_activity(created_at);

-- Function to create a new session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_device_info JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_location_info JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Insert new session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    device_info,
    ip_address,
    user_agent,
    location_info
  )
  VALUES (
    p_user_id,
    p_session_token,
    p_device_info,
    p_ip_address,
    p_user_agent,
    p_location_info
  )
  RETURNING id INTO session_id;
  
  -- Log the login activity
  INSERT INTO session_activity (
    session_id,
    user_id,
    activity_type,
    ip_address,
    user_agent,
    location_info,
    metadata
  )
  VALUES (
    session_id,
    p_user_id,
    'login',
    p_ip_address,
    p_user_agent,
    p_location_info,
    jsonb_build_object('device_info', p_device_info)
  );
  
  RETURN session_id;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
  p_session_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last activity
  UPDATE user_sessions 
  SET last_activity = NOW()
  WHERE session_token = p_session_token 
    AND is_active = true 
    AND expires_at > NOW();
    
  RETURN FOUND;
END;
$$;

-- Function to get user's active sessions
CREATE OR REPLACE FUNCTION get_user_sessions(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  device_name TEXT,
  device_type TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  os_version TEXT,
  ip_address INET,
  location_city TEXT,
  location_country TEXT,
  is_current_session BOOLEAN,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    COALESCE(us.device_info->>'name', 'Unknown Device') as device_name,
    COALESCE(us.device_info->>'type', 'Unknown') as device_type,
    COALESCE(us.device_info->>'browser_name', 'Unknown Browser') as browser_name,
    COALESCE(us.device_info->>'browser_version', '') as browser_version,
    COALESCE(us.device_info->>'os_name', 'Unknown OS') as os_name,
    COALESCE(us.device_info->>'os_version', '') as os_version,
    us.ip_address,
    COALESCE(us.location_info->>'city', 'Unknown') as location_city,
    COALESCE(us.location_info->>'country', 'Unknown') as location_country,
    (us.last_activity > NOW() - INTERVAL '5 minutes') as is_current_session,
    us.last_activity,
    us.created_at,
    us.expires_at
  FROM user_sessions us
  WHERE us.user_id = p_user_id 
    AND us.is_active = true 
    AND us.expires_at > NOW()
  ORDER BY us.last_activity DESC;
END;
$$;

-- Function to revoke a session
CREATE OR REPLACE FUNCTION revoke_session(
  p_session_id UUID,
  p_revoked_by UUID DEFAULT NULL,
  p_revoke_reason TEXT DEFAULT 'User requested'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_user_id UUID;
BEGIN
  -- Get the session user_id
  SELECT user_id INTO session_user_id
  FROM user_sessions
  WHERE id = p_session_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Revoke the session
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoke_reason = p_revoke_reason
  WHERE id = p_session_id;
  
  -- Log the revoke activity
  INSERT INTO session_activity (
    session_id,
    user_id,
    activity_type,
    metadata
  )
  VALUES (
    p_session_id,
    session_user_id,
    'revoke',
    jsonb_build_object(
      'revoked_by', p_revoked_by,
      'reason', p_revoke_reason
    )
  );
  
  RETURN true;
END;
$$;

-- Function to revoke all other sessions (keep current)
CREATE OR REPLACE FUNCTION revoke_other_sessions(
  p_user_id UUID,
  p_keep_session_token TEXT,
  p_revoked_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  -- Revoke all other active sessions
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = NOW(),
    revoked_by = p_revoked_by,
    revoke_reason = 'Revoked all other sessions'
  WHERE user_id = p_user_id 
    AND is_active = true
    AND session_token != p_keep_session_token;
    
  GET DIAGNOSTICS revoked_count = ROW_COUNT;
  
  -- Log the bulk revoke activity
  INSERT INTO session_activity (
    session_id,
    user_id,
    activity_type,
    metadata
  )
  SELECT 
    id,
    user_id,
    'bulk_revoke',
    jsonb_build_object('revoked_count', revoked_count)
  FROM user_sessions
  WHERE user_id = p_user_id 
    AND revoked_at = NOW()
    AND revoke_reason = 'Revoked all other sessions';
  
  RETURN revoked_count;
END;
$$;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Mark expired sessions as inactive
  UPDATE user_sessions
  SET 
    is_active = false,
    revoked_at = NOW(),
    revoke_reason = 'Session expired'
  WHERE is_active = true 
    AND expires_at < NOW();
    
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Log expiration activities
  INSERT INTO session_activity (
    session_id,
    user_id,
    activity_type,
    metadata
  )
  SELECT 
    id,
    user_id,
    'expire',
    jsonb_build_object('expired_at', NOW())
  FROM user_sessions
  WHERE revoked_at = NOW()
    AND revoke_reason = 'Session expired';
  
  RETURN expired_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for session_activity
CREATE POLICY "Users can view their own session activity" ON session_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Create a view for session management dashboard
CREATE OR REPLACE VIEW user_session_dashboard AS
SELECT 
  us.id,
  us.user_id,
  us.device_info,
  us.ip_address,
  us.location_info,
  us.is_active,
  us.last_activity,
  us.created_at,
  us.expires_at,
  CASE 
    WHEN us.last_activity > NOW() - INTERVAL '5 minutes' THEN 'Active Now'
    WHEN us.last_activity > NOW() - INTERVAL '1 hour' THEN 'Active Recently'
    WHEN us.last_activity > NOW() - INTERVAL '1 day' THEN 'Active Today'
    ELSE 'Inactive'
  END as activity_status,
  -- Count recent activity
  (
    SELECT COUNT(*)
    FROM session_activity sa
    WHERE sa.session_id = us.id
      AND sa.created_at > NOW() - INTERVAL '24 hours'
  ) as recent_activity_count
FROM user_sessions us
WHERE us.is_active = true 
  AND us.expires_at > NOW();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_session TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_other_sessions TO authenticated;
GRANT SELECT ON user_session_dashboard TO authenticated;

-- Create automatic cleanup job (if pg_cron is available)
-- This will run every hour to clean up expired sessions
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');
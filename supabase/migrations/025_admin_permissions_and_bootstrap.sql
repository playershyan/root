-- Admin permissions and bootstrap migration
-- This migration adds the required permissions for cleanup and monitoring features
-- and provides a way to bootstrap admin users

-- Add admin permissions for cleanup and monitoring features
-- Update admin users to include new permissions needed for cleanup monitoring
DO $$
DECLARE
  admin_user_record RECORD;
BEGIN
  -- Update existing admin users to have the new permissions
  FOR admin_user_record IN 
    SELECT id, permissions FROM admin_users WHERE role = 'admin' AND is_active = true
  LOOP
    UPDATE admin_users 
    SET permissions = permissions || 
        '["view_dashboard", "manage_cleanup", "manage_alerts"]'::jsonb
    WHERE id = admin_user_record.id;
  END LOOP;
  
  RAISE NOTICE 'Updated existing admin users with new permissions';
END $$;

-- Create function to bootstrap admin user from email
CREATE OR REPLACE FUNCTION bootstrap_admin_user(admin_email TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  user_id UUID
) AS $$
DECLARE
  auth_user_record RECORD;
  existing_admin_record RECORD;
  new_user_id UUID;
BEGIN
  -- Find the user by email in auth.users
  SELECT au.id, au.email 
  INTO auth_user_record
  FROM auth.users au 
  WHERE LOWER(au.email) = LOWER(admin_email)
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      false, 
      'User with email ' || admin_email || ' not found in auth.users. User must sign up first.',
      NULL::UUID;
    RETURN;
  END IF;
  
  new_user_id := auth_user_record.id;
  
  -- Check if user is already an admin
  SELECT id INTO existing_admin_record
  FROM admin_users 
  WHERE user_id = new_user_id;
  
  IF FOUND THEN
    -- Update existing admin to ensure they have all permissions
    UPDATE admin_users 
    SET 
      role = 'admin',
      permissions = '["moderate_listings", "moderate_reports", "manage_admins", "view_dashboard", "manage_cleanup", "manage_alerts"]'::jsonb,
      is_active = true,
      updated_at = NOW()
    WHERE user_id = new_user_id;
    
    RETURN QUERY SELECT 
      true, 
      'User ' || admin_email || ' updated to admin with full permissions.',
      new_user_id;
  ELSE
    -- Insert new admin user
    INSERT INTO admin_users (
      user_id, 
      role, 
      permissions,
      is_active,
      created_by
    ) VALUES (
      new_user_id,
      'admin',
      '["moderate_listings", "moderate_reports", "manage_admins", "view_dashboard", "manage_cleanup", "manage_alerts"]'::jsonb,
      true,
      new_user_id -- Self-created for bootstrap
    );
    
    RETURN QUERY SELECT 
      true, 
      'User ' || admin_email || ' has been granted admin access with full permissions.',
      new_user_id;
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check admin permissions (for debugging)
CREATE OR REPLACE FUNCTION check_admin_permissions(user_email TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  role TEXT,
  permissions JSONB,
  is_active BOOLEAN,
  has_view_dashboard BOOLEAN,
  has_manage_cleanup BOOLEAN,
  has_manage_alerts BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.user_id,
    u.email,
    au.role,
    au.permissions,
    au.is_active,
    (au.permissions ? 'view_dashboard' OR au.role = 'admin') as has_view_dashboard,
    (au.permissions ? 'manage_cleanup' OR au.role = 'admin') as has_manage_cleanup,
    (au.permissions ? 'manage_alerts' OR au.role = 'admin') as has_manage_alerts
  FROM admin_users au
  JOIN auth.users u ON au.user_id = u.id
  WHERE (user_email IS NULL OR LOWER(u.email) = LOWER(user_email))
  ORDER BY au.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (these can be called by authenticated users)
GRANT EXECUTE ON FUNCTION bootstrap_admin_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_permissions(TEXT) TO authenticated;

-- Bootstrap default admin user using a common development email pattern
-- This is commented out - you should run this manually with the correct email
/*
Example usage to bootstrap your first admin:

-- Replace 'your-email@domain.com' with your actual email address
SELECT * FROM bootstrap_admin_user('your-email@domain.com');

-- Check admin permissions for all users
SELECT * FROM check_admin_permissions();

-- Check permissions for specific user
SELECT * FROM check_admin_permissions('your-email@domain.com');
*/

-- Create a fallback admin check function for development
-- This allows certain email patterns to have admin access temporarily
CREATE OR REPLACE FUNCTION is_development_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow common development email patterns
  -- REMOVE THIS IN PRODUCTION!
  RETURN (
    user_email ILIKE '%@admin.local' OR
    user_email ILIKE '%@dev.local' OR
    user_email ILIKE 'admin@%' OR
    user_email = 'test@example.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin auth middleware to include fallback for development
-- This is a temporary function that can be used if no admin users exist
CREATE OR REPLACE FUNCTION has_admin_access(check_user_id UUID)
RETURNS TABLE (
  is_admin BOOLEAN,
  user_role TEXT,
  user_permissions JSONB,
  is_fallback BOOLEAN
) AS $$
DECLARE
  admin_record RECORD;
  user_record RECORD;
  admin_count INTEGER;
BEGIN
  -- First check if user is in admin_users table
  SELECT au.role, au.permissions, au.is_active
  INTO admin_record
  FROM admin_users au
  WHERE au.user_id = check_user_id AND au.is_active = true;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      true,
      admin_record.role,
      admin_record.permissions,
      false;
    RETURN;
  END IF;
  
  -- If no admin users exist at all, check for development fallback
  SELECT COUNT(*) INTO admin_count FROM admin_users WHERE is_active = true;
  
  IF admin_count = 0 THEN
    -- Get user email for fallback check
    SELECT email INTO user_record FROM auth.users WHERE id = check_user_id;
    
    IF FOUND AND is_development_admin(user_record.email) THEN
      RETURN QUERY SELECT 
        true,
        'admin'::TEXT,
        '["moderate_listings", "moderate_reports", "manage_admins", "view_dashboard", "manage_cleanup", "manage_alerts"]'::jsonb,
        true;
      RETURN;
    END IF;
  END IF;
  
  -- No admin access
  RETURN QUERY SELECT 
    false,
    NULL::TEXT,
    NULL::jsonb,
    false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION has_admin_access(UUID) TO authenticated;

COMMENT ON FUNCTION bootstrap_admin_user(TEXT) IS 'Bootstrap first admin user by email address';
COMMENT ON FUNCTION check_admin_permissions(TEXT) IS 'Check admin permissions for debugging';
COMMENT ON FUNCTION has_admin_access(UUID) IS 'Check if user has admin access with development fallback';
COMMENT ON FUNCTION is_development_admin(TEXT) IS 'Development fallback admin check - REMOVE IN PRODUCTION!';
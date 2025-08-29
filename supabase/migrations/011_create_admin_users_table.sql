-- Create admin_users table for admin access control
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'moderator',
  permissions JSONB DEFAULT '["moderate_listings", "moderate_reports"]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(user_id)
);

-- Create index for better query performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - only admins can view/modify admin users
CREATE POLICY "Admin users can view admin users table" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND (au.role = 'admin' OR 'manage_admins' = ANY(au.permissions::text[]))
    )
  );

CREATE POLICY "Admin users can update admin users" ON admin_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.is_active = true
      AND (au.role = 'admin' OR 'manage_admins' = ANY(au.permissions::text[]))
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_timestamp
BEFORE UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION update_admin_users_updated_at();

-- Insert the first admin user (replace with your actual user ID)
-- You'll need to run this manually with your user ID from auth.users table
-- INSERT INTO admin_users (user_id, role, permissions) 
-- VALUES ('your-user-id-here', 'admin', '["moderate_listings", "moderate_reports", "manage_admins"]');
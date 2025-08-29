-- Create business_profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  address TEXT,
  phone VARCHAR(50),
  operating_hours VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_paused BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paused_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_is_active ON business_profiles(is_active);
CREATE INDEX idx_business_profiles_is_paused ON business_profiles(is_paused);
CREATE INDEX idx_business_profiles_is_verified ON business_profiles(is_verified);

-- Enable Row Level Security
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for business_profiles
-- Users can view their own business profile
CREATE POLICY "Users can view own business profile" ON business_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own business profile
CREATE POLICY "Users can create own business profile" ON business_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own business profile
CREATE POLICY "Users can update own business profile" ON business_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can soft delete their own business profile
CREATE POLICY "Users can delete own business profile" ON business_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Public can view active and non-paused business profiles
CREATE POLICY "Public can view active business profiles" ON business_profiles
  FOR SELECT USING (is_active = TRUE AND is_paused = FALSE AND deleted_at IS NULL);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_profiles_timestamp
BEFORE UPDATE ON business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_business_profiles_updated_at();

-- Create trigger to set paused_at when pausing
CREATE OR REPLACE FUNCTION update_business_profiles_paused_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_paused = TRUE AND OLD.is_paused = FALSE THEN
        NEW.paused_at = NOW();
    ELSIF NEW.is_paused = FALSE AND OLD.is_paused = TRUE THEN
        NEW.paused_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_profiles_paused_timestamp
BEFORE UPDATE ON business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_business_profiles_paused_at();
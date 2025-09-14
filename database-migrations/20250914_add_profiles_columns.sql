-- Add missing columns to profiles table for profile setup functionality
-- Migration: 20250914_add_profiles_columns

BEGIN;

-- Add missing columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'business')),
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'LK',
ADD COLUMN IF NOT EXISTS membership_type TEXT DEFAULT 'basic' CHECK (membership_type IN ('basic', 'premium', 'dealer')),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_type ON public.profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- Update existing RLS policies to handle the new columns
-- The existing policies should already work with the new columns

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.name IS 'User full name';
COMMENT ON COLUMN public.profiles.phone IS 'User phone number in international format';
COMMENT ON COLUMN public.profiles.location IS 'User location (city/area)';
COMMENT ON COLUMN public.profiles.account_type IS 'Type of account - individual or business';
COMMENT ON COLUMN public.profiles.country IS 'Country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN public.profiles.membership_type IS 'Membership tier - basic, premium, or dealer';
COMMENT ON COLUMN public.profiles.language IS 'Preferred language code';
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Profile picture URL';

COMMIT;
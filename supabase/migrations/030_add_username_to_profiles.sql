-- Migration: Add username support to profiles table
-- Date: 2025-09-18
-- Description: Add username column and phone verification fields for streamlined signup

BEGIN;

-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add phone verification columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS temp_phone_otp_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Add constraint to ensure username format (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'username_format_check'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT username_format_check
      CHECK (username IS NULL OR (
        length(username) >= 3 AND
        length(username) <= 20 AND
        username ~ '^[a-zA-Z0-9_.-]+$' AND
        username !~ '^[._-]' AND
        username !~ '[._-]$' AND
        username !~ '[._-]{2,}'
      ));
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.profiles.username IS 'Unique username for the user (3-20 chars, alphanumeric + dots/dashes/underscores)';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Whether the phone number has been verified via OTP';
COMMENT ON COLUMN public.profiles.temp_phone IS 'Temporary phone number during verification process';
COMMENT ON COLUMN public.profiles.temp_phone_otp_sent_at IS 'Timestamp when OTP was last sent to temp_phone';

COMMIT;
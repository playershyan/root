-- Add whatsapp column to profiles table
-- Migration: 20251121_add_whatsapp_to_profiles

BEGIN;

-- Add whatsapp column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.whatsapp IS 'User WhatsApp number in international format';

COMMIT;

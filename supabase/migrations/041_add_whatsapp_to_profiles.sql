-- Add whatsapp column to profiles and business_profiles tables
-- This field is used in forms and expected by the application code

BEGIN;

-- Add whatsapp column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add whatsapp column to business_profiles table
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);
CREATE INDEX IF NOT EXISTS idx_business_profiles_whatsapp ON public.business_profiles(whatsapp);

-- Add comments to document the fields
COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp number in format: country code + number without zero';
COMMENT ON COLUMN public.business_profiles.whatsapp IS 'WhatsApp number in format: country code + number without zero';

COMMIT;


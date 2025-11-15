-- Fix phone_verifications table to allow NULL user_id for registration flows
-- This allows OTP verification before user account creation

BEGIN;

-- Make user_id nullable in phone_verifications table
ALTER TABLE public.phone_verifications 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policy to allow inserts with NULL user_id for registration
-- This allows service role to insert records with NULL user_id
DROP POLICY IF EXISTS "Users can insert own verifications" ON public.phone_verifications;

-- New policy: Allow authenticated users to insert their own, OR allow NULL user_id (for registration)
CREATE POLICY "Users can insert own verifications or registration OTPs" ON public.phone_verifications
FOR INSERT 
WITH CHECK (
  -- Authenticated users can insert their own verifications
  ((select auth.uid()) = user_id)
  OR
  -- Allow NULL user_id for registration flows (requires service role to bypass RLS)
  (user_id IS NULL)
);

-- Add comment explaining the nullable user_id
COMMENT ON COLUMN public.phone_verifications.user_id IS 
'User ID for authenticated users. NULL for registration flows (will be set when user is created)';

COMMIT;


-- Migration: Sync Google OAuth avatar to profiles table
-- Created: 2025-10-31
-- Description: Automatically sync user avatar from Google OAuth metadata to profiles table

-- Function to sync avatar from auth.users metadata to profiles
CREATE OR REPLACE FUNCTION public.sync_user_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has a picture in user_metadata (from Google OAuth)
  IF NEW.raw_user_meta_data ? 'picture' OR NEW.raw_user_meta_data ? 'avatar_url' THEN
    -- Update or insert profile with avatar_url from Google
    INSERT INTO public.profiles (id, avatar_url, updated_at)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatar_url'
      ),
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      avatar_url = COALESCE(
        NEW.raw_user_meta_data->>'picture',
        NEW.raw_user_meta_data->>'avatar_url',
        public.profiles.avatar_url  -- Keep existing if no new one
      ),
      updated_at = NOW()
    WHERE public.profiles.avatar_url IS NULL OR public.profiles.avatar_url = '';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_sync_avatar ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_sync_avatar
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_avatar();

-- Backfill existing users who have Google avatars but no profile avatar
UPDATE public.profiles p
SET
  avatar_url = COALESCE(
    u.raw_user_meta_data->>'picture',
    u.raw_user_meta_data->>'avatar_url'
  ),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (p.avatar_url IS NULL OR p.avatar_url = '')
  AND (u.raw_user_meta_data ? 'picture' OR u.raw_user_meta_data ? 'avatar_url');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.sync_user_avatar() IS 'Automatically syncs Google OAuth avatar URL to profiles table on user creation or update';

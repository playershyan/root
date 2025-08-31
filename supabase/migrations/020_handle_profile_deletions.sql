-- Migration to handle profile deletions and cascade effects
-- This migration creates triggers and functions to handle:
-- 1. Business profile deletion (soft delete) - updates phone sources
-- 2. User account deletion - cascades to ads and wanted requests

-- ============================================
-- PART 1: BUSINESS PROFILE DELETION HANDLING
-- ============================================

-- Add columns to track phone source if not exists
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS phone_source TEXT DEFAULT 'user' CHECK (phone_source IN ('user', 'business'));

ALTER TABLE public.wanted_requests
ADD COLUMN IF NOT EXISTS phone_source TEXT DEFAULT 'user' CHECK (phone_source IN ('user', 'business'));

-- Function to handle business profile deletion
-- Updates all ads and wanted requests to use user profile phone
CREATE OR REPLACE FUNCTION public.handle_business_profile_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a business profile is soft deleted (is_active = false)
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    -- Update all listings by this user to use personal profile phone
    UPDATE public.listings
    SET phone_source = 'user',
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Update all wanted requests by this user to use personal profile phone
    UPDATE public.wanted_requests
    SET phone_source = 'user',
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for business profile deletion
DROP TRIGGER IF EXISTS on_business_profile_deleted ON public.business_profiles;
CREATE TRIGGER on_business_profile_deleted
  AFTER UPDATE ON public.business_profiles
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION public.handle_business_profile_deletion();

-- ============================================
-- PART 2: USER ACCOUNT DELETION CASCADE
-- ============================================

-- Create soft delete tables for archiving deleted content
CREATE TABLE IF NOT EXISTS public.deleted_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  price DECIMAL,
  phone TEXT,
  email TEXT,
  location TEXT,
  images JSONB,
  metadata JSONB, -- Store all other fields as JSON
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_reason TEXT DEFAULT 'user_account_deleted'
);

CREATE TABLE IF NOT EXISTS public.deleted_wanted_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID NOT NULL,
  title TEXT,
  description TEXT,
  min_budget DECIMAL,
  max_budget DECIMAL,
  phone TEXT,
  location TEXT,
  metadata JSONB, -- Store all other fields as JSON
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_reason TEXT DEFAULT 'user_account_deleted'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deleted_listings_user_id ON public.deleted_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_at ON public.deleted_listings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deleted_wanted_requests_user_id ON public.deleted_wanted_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_wanted_requests_deleted_at ON public.deleted_wanted_requests(deleted_at);

-- Function to archive and delete user's listings
CREATE OR REPLACE FUNCTION public.archive_user_listings(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Archive listings to deleted_listings table
  INSERT INTO public.deleted_listings (
    original_id,
    user_id,
    title,
    description,
    price,
    phone,
    email,
    location,
    images,
    metadata,
    deletion_reason
  )
  SELECT 
    id,
    user_id,
    title,
    description,
    price,
    phone,
    email,
    location,
    images,
    jsonb_build_object(
      'make', make,
      'model', model,
      'year', year,
      'mileage', mileage,
      'condition', condition,
      'fuel_type', fuel_type,
      'transmission', transmission,
      'created_at', created_at,
      'updated_at', updated_at,
      'status', status,
      'views', views
    ),
    'user_account_deleted'
  FROM public.listings
  WHERE user_id = p_user_id;
  
  -- Delete the listings
  DELETE FROM public.listings WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive and delete user's wanted requests
CREATE OR REPLACE FUNCTION public.archive_user_wanted_requests(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Archive wanted requests to deleted_wanted_requests table
  INSERT INTO public.deleted_wanted_requests (
    original_id,
    user_id,
    title,
    description,
    min_budget,
    max_budget,
    phone,
    location,
    metadata,
    deletion_reason
  )
  SELECT 
    id,
    user_id,
    title,
    description,
    min_budget,
    max_budget,
    phone,
    location,
    jsonb_build_object(
      'make', make,
      'model', model,
      'min_year', min_year,
      'max_year', max_year,
      'fuel_type', fuel_type,
      'transmission', transmission,
      'max_mileage', max_mileage,
      'urgency', urgency,
      'created_at', created_at,
      'updated_at', updated_at,
      'is_active', is_active,
      'view_count', view_count,
      'response_count', response_count
    ),
    'user_account_deleted'
  FROM public.wanted_requests
  WHERE user_id = p_user_id;
  
  -- Delete the wanted requests
  DELETE FROM public.wanted_requests WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle complete user deletion
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Archive and delete all user's listings
  PERFORM public.archive_user_listings(OLD.id);
  
  -- Archive and delete all user's wanted requests
  PERFORM public.archive_user_wanted_requests(OLD.id);
  
  -- Soft delete business profile if exists
  UPDATE public.business_profiles
  SET is_active = FALSE,
      deleted_at = NOW()
  WHERE user_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
-- This will fire when a user record is deleted from profiles table
DROP TRIGGER IF EXISTS on_user_deleted ON public.profiles;
CREATE TRIGGER on_user_deleted
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();

-- ============================================
-- PART 3: CLEANUP AND RECOVERY FUNCTIONS
-- ============================================

-- Function to restore deleted listings (admin use)
CREATE OR REPLACE FUNCTION public.restore_deleted_listing(p_deleted_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_deleted_record RECORD;
BEGIN
  -- Get the deleted record
  SELECT * INTO v_deleted_record
  FROM public.deleted_listings
  WHERE id = p_deleted_id;
  
  IF v_deleted_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Restore to listings table
  INSERT INTO public.listings (
    id,
    user_id,
    title,
    description,
    price,
    phone,
    email,
    location,
    images,
    make,
    model,
    year,
    mileage,
    condition,
    fuel_type,
    transmission,
    created_at,
    updated_at,
    status
  )
  VALUES (
    v_deleted_record.original_id,
    v_deleted_record.user_id,
    v_deleted_record.title,
    v_deleted_record.description,
    v_deleted_record.price,
    v_deleted_record.phone,
    v_deleted_record.email,
    v_deleted_record.location,
    v_deleted_record.images,
    v_deleted_record.metadata->>'make',
    v_deleted_record.metadata->>'model',
    (v_deleted_record.metadata->>'year')::INTEGER,
    (v_deleted_record.metadata->>'mileage')::INTEGER,
    v_deleted_record.metadata->>'condition',
    v_deleted_record.metadata->>'fuel_type',
    v_deleted_record.metadata->>'transmission',
    (v_deleted_record.metadata->>'created_at')::TIMESTAMP WITH TIME ZONE,
    NOW(),
    'active'
  );
  
  -- Remove from deleted table
  DELETE FROM public.deleted_listings WHERE id = p_deleted_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to permanently delete old archived records (30 days+)
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_records()
RETURNS VOID AS $$
BEGIN
  -- Delete listings archived more than 30 days ago
  DELETE FROM public.deleted_listings
  WHERE deleted_at < NOW() - INTERVAL '30 days';
  
  -- Delete wanted requests archived more than 30 days ago
  DELETE FROM public.deleted_wanted_requests
  WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policies for deleted tables (admin only access)
ALTER TABLE public.deleted_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_wanted_requests ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access deleted records
CREATE POLICY "Service role can view deleted listings" ON public.deleted_listings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view deleted wanted requests" ON public.deleted_wanted_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.deleted_listings IS 'Archive table for soft-deleted listings when user accounts are deleted';
COMMENT ON TABLE public.deleted_wanted_requests IS 'Archive table for soft-deleted wanted requests when user accounts are deleted';
COMMENT ON FUNCTION public.handle_business_profile_deletion IS 'Handles business profile soft deletion by updating phone sources in related records';
COMMENT ON FUNCTION public.handle_user_deletion IS 'Handles user account deletion by archiving and removing all user content';
COMMENT ON FUNCTION public.cleanup_old_deleted_records IS 'Removes archived records older than 30 days - should be run periodically';
-- Migration for monitoring, alerting, and recovery features
-- This adds comprehensive tracking, business profile recovery, and admin monitoring

-- ============================================
-- PART 1: MONITORING & STATISTICS TABLES
-- ============================================

-- Table to track cleanup activities and statistics
CREATE TABLE IF NOT EXISTS public.cleanup_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  listings_deleted INTEGER DEFAULT 0,
  wanted_requests_deleted INTEGER DEFAULT 0,
  total_records_deleted INTEGER DEFAULT 0,
  storage_freed_mb DECIMAL(10,2) DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'partial')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track user recovery requests
CREATE TABLE IF NOT EXISTS public.recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('account', 'business_profile', 'listings', 'wanted_requests')),
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'completed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Table to track business profile deletions and recovery eligibility
CREATE TABLE IF NOT EXISTS public.deleted_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id UUID NOT NULL,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  operating_hours TEXT,
  logo_url TEXT,
  banner_url TEXT,
  profile_image_url TEXT,
  was_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recovery_deadline TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  deletion_reason TEXT DEFAULT 'user_requested',
  can_recover BOOLEAN DEFAULT TRUE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_date ON public.cleanup_logs(execution_date);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_user_id ON public.recovery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_requests_status ON public.recovery_requests(status);
CREATE INDEX IF NOT EXISTS idx_deleted_business_profiles_user_id ON public.deleted_business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_business_profiles_deadline ON public.deleted_business_profiles(recovery_deadline);

-- ============================================
-- PART 2: ENHANCED CLEANUP WITH MONITORING
-- ============================================

-- Enhanced cleanup function with detailed monitoring
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_records_monitored()
RETURNS JSONB AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE := NOW();
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_execution_time_ms INTEGER;
  v_listings_deleted INTEGER := 0;
  v_wanted_deleted INTEGER := 0;
  v_business_profiles_deleted INTEGER := 0;
  v_total_deleted INTEGER := 0;
  v_storage_freed_mb DECIMAL(10,2) := 0;
  v_error_message TEXT;
  v_status TEXT := 'success';
  v_result JSONB;
BEGIN
  -- Delete expired listings and count them
  WITH deleted_listings AS (
    DELETE FROM public.deleted_listings
    WHERE deleted_at < NOW() - INTERVAL '30 days'
    RETURNING pg_column_size(metadata) as size_bytes
  )
  SELECT COUNT(*), COALESCE(SUM(size_bytes), 0) / (1024 * 1024)
  INTO v_listings_deleted, v_storage_freed_mb
  FROM deleted_listings;
  
  -- Delete expired wanted requests and count them
  WITH deleted_wanted AS (
    DELETE FROM public.deleted_wanted_requests
    WHERE deleted_at < NOW() - INTERVAL '30 days'
    RETURNING pg_column_size(metadata) as size_bytes
  )
  SELECT COUNT(*), COALESCE(SUM(size_bytes), 0) / (1024 * 1024) + v_storage_freed_mb
  INTO v_wanted_deleted, v_storage_freed_mb
  FROM deleted_wanted;
  
  -- Delete expired business profiles
  DELETE FROM public.deleted_business_profiles
  WHERE recovery_deadline < NOW() AND can_recover = FALSE;
  
  GET DIAGNOSTICS v_business_profiles_deleted = ROW_COUNT;
  
  -- Calculate totals
  v_total_deleted := v_listings_deleted + v_wanted_deleted + v_business_profiles_deleted;
  v_end_time := NOW();
  v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
  
  -- Log the cleanup activity
  INSERT INTO public.cleanup_logs (
    listings_deleted,
    wanted_requests_deleted,
    total_records_deleted,
    storage_freed_mb,
    execution_time_ms,
    status
  ) VALUES (
    v_listings_deleted,
    v_wanted_deleted,
    v_total_deleted,
    v_storage_freed_mb,
    v_execution_time_ms,
    v_status
  );
  
  -- Build result object
  v_result := jsonb_build_object(
    'status', v_status,
    'listings_deleted', v_listings_deleted,
    'wanted_requests_deleted', v_wanted_deleted,
    'business_profiles_deleted', v_business_profiles_deleted,
    'total_deleted', v_total_deleted,
    'storage_freed_mb', v_storage_freed_mb,
    'execution_time_ms', v_execution_time_ms,
    'executed_at', v_start_time
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_status := 'error';
    v_end_time := NOW();
    v_execution_time_ms := EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000;
    
    -- Log the error
    INSERT INTO public.cleanup_logs (
      listings_deleted,
      wanted_requests_deleted,
      total_records_deleted,
      storage_freed_mb,
      execution_time_ms,
      status,
      error_message
    ) VALUES (
      v_listings_deleted,
      v_wanted_deleted,
      v_total_deleted,
      v_storage_freed_mb,
      v_execution_time_ms,
      v_status,
      v_error_message
    );
    
    -- Return error details
    RETURN jsonb_build_object(
      'status', 'error',
      'error_message', v_error_message,
      'listings_deleted', v_listings_deleted,
      'wanted_requests_deleted', v_wanted_deleted,
      'execution_time_ms', v_execution_time_ms
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 3: BUSINESS PROFILE RECOVERY SYSTEM
-- ============================================

-- Enhanced business profile deletion handler with recovery support
CREATE OR REPLACE FUNCTION public.handle_business_profile_deletion_with_recovery()
RETURNS TRIGGER AS $$
BEGIN
  -- When a business profile is soft deleted (is_active = false)
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    
    -- Archive the business profile for recovery
    INSERT INTO public.deleted_business_profiles (
      original_id,
      user_id,
      business_name,
      description,
      website,
      address,
      phone,
      whatsapp,
      operating_hours,
      logo_url,
      banner_url,
      profile_image_url,
      was_verified,
      metadata,
      deletion_reason
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.business_name,
      NEW.description,
      NEW.website,
      NEW.address,
      NEW.phone,
      NEW.whatsapp,
      NEW.operating_hours,
      NEW.logo_url,
      NEW.banner_url,
      NEW.profile_image_url,
      NEW.is_verified,
      jsonb_build_object(
        'created_at', NEW.created_at,
        'updated_at', NEW.updated_at,
        'is_paused', NEW.is_paused
      ),
      COALESCE(NEW.deletion_reason, 'user_requested')
    );
    
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

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_business_profile_deleted ON public.business_profiles;
CREATE TRIGGER on_business_profile_deleted
  AFTER UPDATE ON public.business_profiles
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION public.handle_business_profile_deletion_with_recovery();

-- Function to recover a deleted business profile
CREATE OR REPLACE FUNCTION public.recover_business_profile(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_deleted_profile RECORD;
  v_new_profile_id UUID;
  v_result JSONB;
BEGIN
  -- Find the most recent deleted business profile for this user within grace period
  SELECT * INTO v_deleted_profile
  FROM public.deleted_business_profiles
  WHERE user_id = p_user_id
    AND can_recover = TRUE
    AND recovery_deadline > NOW()
  ORDER BY deleted_at DESC
  LIMIT 1;
  
  IF v_deleted_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'No recoverable business profile found or grace period expired'
    );
  END IF;
  
  -- Generate new ID for the recovered profile
  v_new_profile_id := gen_random_uuid();
  
  -- Recreate the business profile
  INSERT INTO public.business_profiles (
    id,
    user_id,
    business_name,
    description,
    website,
    address,
    phone,
    whatsapp,
    operating_hours,
    logo_url,
    banner_url,
    profile_image_url,
    is_verified,
    is_active,
    is_paused,
    created_at,
    updated_at
  ) VALUES (
    v_new_profile_id,
    v_deleted_profile.user_id,
    v_deleted_profile.business_name,
    v_deleted_profile.description,
    v_deleted_profile.website,
    v_deleted_profile.address,
    v_deleted_profile.phone,
    v_deleted_profile.whatsapp,
    v_deleted_profile.operating_hours,
    v_deleted_profile.logo_url,
    v_deleted_profile.banner_url,
    v_deleted_profile.profile_image_url,
    v_deleted_profile.was_verified,
    TRUE, -- is_active
    FALSE, -- is_paused
    COALESCE((v_deleted_profile.metadata->>'created_at')::TIMESTAMP WITH TIME ZONE, NOW()),
    NOW()
  );
  
  -- Update listings to use business profile phone again
  UPDATE public.listings
  SET phone_source = 'business',
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Update wanted requests to use business profile phone again
  UPDATE public.wanted_requests
  SET phone_source = 'business',
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Mark the deleted profile as recovered (no longer recoverable)
  UPDATE public.deleted_business_profiles
  SET can_recover = FALSE
  WHERE id = v_deleted_profile.id;
  
  v_result := jsonb_build_object(
    'success', TRUE,
    'message', 'Business profile recovered successfully',
    'profile_id', v_new_profile_id,
    'business_name', v_deleted_profile.business_name
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if business profile can be recovered
CREATE OR REPLACE FUNCTION public.check_business_profile_recovery(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_deleted_profile RECORD;
  v_days_remaining INTEGER;
BEGIN
  SELECT * INTO v_deleted_profile
  FROM public.deleted_business_profiles
  WHERE user_id = p_user_id
    AND can_recover = TRUE
    AND recovery_deadline > NOW()
  ORDER BY deleted_at DESC
  LIMIT 1;
  
  IF v_deleted_profile IS NULL THEN
    RETURN jsonb_build_object(
      'can_recover', FALSE,
      'message', 'No recoverable business profile found'
    );
  END IF;
  
  v_days_remaining := EXTRACT(DAYS FROM (v_deleted_profile.recovery_deadline - NOW()));
  
  RETURN jsonb_build_object(
    'can_recover', TRUE,
    'business_name', v_deleted_profile.business_name,
    'deleted_at', v_deleted_profile.deleted_at,
    'recovery_deadline', v_deleted_profile.recovery_deadline,
    'days_remaining', v_days_remaining,
    'deletion_reason', v_deleted_profile.deletion_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 4: ADMIN MONITORING VIEWS
-- ============================================

-- View for admin dashboard - cleanup statistics
CREATE OR REPLACE VIEW public.admin_cleanup_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as cleanup_date,
  COUNT(*) as cleanup_runs,
  SUM(listings_deleted) as total_listings_deleted,
  SUM(wanted_requests_deleted) as total_wanted_deleted,
  SUM(total_records_deleted) as total_records_deleted,
  SUM(storage_freed_mb) as total_storage_freed_mb,
  AVG(execution_time_ms) as avg_execution_time_ms,
  COUNT(*) FILTER (WHERE status = 'error') as error_count,
  COUNT(*) FILTER (WHERE status = 'success') as success_count
FROM public.cleanup_logs
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY cleanup_date DESC;

-- View for admin dashboard - recovery statistics  
CREATE OR REPLACE VIEW public.admin_recovery_stats AS
SELECT
  request_type,
  status,
  COUNT(*) as request_count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_requests,
  COUNT(*) FILTER (WHERE expires_at < NOW() AND status = 'pending') as expired_pending
FROM public.recovery_requests
GROUP BY request_type, status
ORDER BY request_type, status;

-- View for admin dashboard - business profile recovery eligibility
CREATE OR REPLACE VIEW public.admin_business_recovery_eligible AS
SELECT
  user_id,
  business_name,
  deleted_at,
  recovery_deadline,
  EXTRACT(DAYS FROM (recovery_deadline - NOW())) as days_remaining,
  deletion_reason
FROM public.deleted_business_profiles
WHERE can_recover = TRUE 
  AND recovery_deadline > NOW()
ORDER BY recovery_deadline ASC;

-- ============================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.cleanup_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_business_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for cleanup_logs (admin only)
CREATE POLICY "Service role can access cleanup logs" ON public.cleanup_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for recovery_requests
CREATE POLICY "Users can view their own recovery requests" ON public.recovery_requests
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Users can create recovery requests" ON public.recovery_requests
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Service role can manage recovery requests" ON public.recovery_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for deleted_business_profiles  
CREATE POLICY "Users can view their own deleted business profiles" ON public.deleted_business_profiles
  FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Service role can access deleted business profiles" ON public.deleted_business_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE public.cleanup_logs IS 'Tracks automated cleanup activities and performance metrics';
COMMENT ON TABLE public.recovery_requests IS 'User requests for data recovery within grace period';
COMMENT ON TABLE public.deleted_business_profiles IS 'Soft-deleted business profiles eligible for recovery';
COMMENT ON FUNCTION public.cleanup_old_deleted_records_monitored IS 'Enhanced cleanup with comprehensive monitoring and logging';
COMMENT ON FUNCTION public.recover_business_profile IS 'Recovers a deleted business profile within grace period';
COMMENT ON FUNCTION public.check_business_profile_recovery IS 'Checks if business profile can be recovered and returns details';
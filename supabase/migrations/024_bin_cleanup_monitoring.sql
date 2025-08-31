-- Add bin cleanup monitoring and statistics tracking
-- This migration adds comprehensive monitoring for the user bin system

-- Extend admin cleanup stats to include bin metrics
ALTER TABLE admin_cleanup_stats ADD COLUMN IF NOT EXISTS bin_items_deleted INTEGER DEFAULT 0;
ALTER TABLE admin_cleanup_stats ADD COLUMN IF NOT EXISTS bin_listings_cleaned INTEGER DEFAULT 0;
ALTER TABLE admin_cleanup_stats ADD COLUMN IF NOT EXISTS bin_wanted_requests_cleaned INTEGER DEFAULT 0;
ALTER TABLE admin_cleanup_stats ADD COLUMN IF NOT EXISTS bin_storage_freed_mb NUMERIC(10,2) DEFAULT 0;

-- Create bin statistics view for admin dashboard
CREATE OR REPLACE VIEW admin_bin_stats AS
SELECT
  COUNT(DISTINCT dl.id) + COUNT(DISTINCT dwr.id) as total_bin_items,
  COUNT(DISTINCT dl.id) as bin_listings_count,
  COUNT(DISTINCT dwr.id) as bin_wanted_requests_count,
  COUNT(DISTINCT CASE WHEN dl.deleted_at >= CURRENT_DATE - INTERVAL '7 days' THEN dl.id END) +
  COUNT(DISTINCT CASE WHEN dwr.deleted_at >= CURRENT_DATE - INTERVAL '7 days' THEN dwr.id END) as recent_bin_additions,
  COUNT(DISTINCT CASE WHEN dl.deleted_at <= CURRENT_DATE - INTERVAL '23 days' THEN dl.id END) +
  COUNT(DISTINCT CASE WHEN dwr.deleted_at <= CURRENT_DATE - INTERVAL '23 days' THEN dwr.id END) as items_expiring_soon,
  EXTRACT(EPOCH FROM AVG(CURRENT_TIMESTAMP - dl.deleted_at))/86400 as avg_days_in_bin_listings,
  EXTRACT(EPOCH FROM AVG(CURRENT_TIMESTAMP - dwr.deleted_at))/86400 as avg_days_in_bin_wanted
FROM deleted_listings dl
FULL OUTER JOIN deleted_wanted_requests dwr ON false;

-- Enhanced cleanup function that includes bin cleanup monitoring
CREATE OR REPLACE FUNCTION cleanup_old_deleted_records_monitored()
RETURNS TABLE (
  total_deleted INTEGER,
  listings_deleted INTEGER,
  wanted_requests_deleted INTEGER,
  business_profiles_deleted INTEGER,
  bin_items_cleaned INTEGER,
  storage_freed_mb NUMERIC,
  execution_time_ms INTEGER,
  cleanup_date DATE,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  v_total_deleted INTEGER := 0;
  v_listings_deleted INTEGER := 0;
  v_wanted_deleted INTEGER := 0;
  v_business_deleted INTEGER := 0;
  v_bin_items_cleaned INTEGER := 0;
  v_storage_freed NUMERIC := 0;
  v_execution_time INTEGER;
  v_error_message TEXT := NULL;
  v_success BOOLEAN := true;
  cutoff_date DATE := CURRENT_DATE - INTERVAL '30 days';
BEGIN
  start_time := clock_timestamp();
  
  BEGIN
    -- Clean up expired deleted listings (bin cleanup)
    WITH deleted_listings AS (
      DELETE FROM public.deleted_listings
      WHERE deleted_at::date <= cutoff_date
      RETURNING id, 
        -- Estimate storage: title(50) + description(500) + images(1000) = ~1.5KB per listing
        1.5 as estimated_kb_per_record
    )
    SELECT COUNT(*), COALESCE(SUM(estimated_kb_per_record)/1024, 0)
    INTO v_listings_deleted, v_storage_freed
    FROM deleted_listings;

    -- Clean up expired deleted wanted requests (bin cleanup)  
    WITH deleted_wanted AS (
      DELETE FROM public.deleted_wanted_requests
      WHERE deleted_at::date <= cutoff_date
      RETURNING id,
        -- Estimate storage: title(50) + description(500) = ~550 bytes per wanted request
        0.55 as estimated_kb_per_record
    )
    SELECT COUNT(*), COALESCE(SUM(estimated_kb_per_record)/1024, 0)
    INTO v_wanted_deleted, v_storage_freed
    FROM deleted_wanted;
    
    v_storage_freed := v_storage_freed + COALESCE((SELECT SUM(estimated_kb_per_record)/1024 FROM (SELECT 0.55 as estimated_kb_per_record FROM deleted_wanted_requests WHERE deleted_at::date <= cutoff_date LIMIT v_wanted_deleted) t), 0);

    -- Clean up expired deleted business profiles
    WITH deleted_businesses AS (
      DELETE FROM public.deleted_business_profiles
      WHERE deleted_at::date <= cutoff_date
      RETURNING id,
        -- Estimate storage: business data ~2KB per profile
        2.0 as estimated_kb_per_record
    )
    SELECT COUNT(*), COALESCE(SUM(estimated_kb_per_record)/1024, 0)
    INTO v_business_deleted, v_storage_freed
    FROM deleted_businesses;
    
    v_storage_freed := v_storage_freed + COALESCE((SELECT SUM(estimated_kb_per_record)/1024 FROM (SELECT 2.0 as estimated_kb_per_record FROM deleted_business_profiles WHERE deleted_at::date <= cutoff_date LIMIT v_business_deleted) t), 0);
    
    -- Calculate totals
    v_bin_items_cleaned := v_listings_deleted + v_wanted_deleted;
    v_total_deleted := v_listings_deleted + v_wanted_deleted + v_business_deleted;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    v_success := false;
    RAISE WARNING 'Cleanup error: %', v_error_message;
  END;
  
  end_time := clock_timestamp();
  v_execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  
  -- Insert cleanup statistics including bin metrics
  INSERT INTO admin_cleanup_stats (
    cleanup_date,
    cleanup_runs,
    total_records_deleted,
    total_storage_freed_mb,
    avg_execution_time_ms,
    error_count,
    success_count,
    bin_items_deleted,
    bin_listings_cleaned,
    bin_wanted_requests_cleaned,
    bin_storage_freed_mb,
    last_cleanup_at
  ) VALUES (
    CURRENT_DATE,
    1,
    v_total_deleted,
    v_storage_freed,
    v_execution_time,
    CASE WHEN v_success THEN 0 ELSE 1 END,
    CASE WHEN v_success THEN 1 ELSE 0 END,
    v_bin_items_cleaned,
    v_listings_deleted,
    v_wanted_deleted,
    v_storage_freed * 0.6, -- Rough estimate that 60% of freed storage is from bin items
    CURRENT_TIMESTAMP
  ) ON CONFLICT (cleanup_date) DO UPDATE SET
    cleanup_runs = admin_cleanup_stats.cleanup_runs + 1,
    total_records_deleted = admin_cleanup_stats.total_records_deleted + v_total_deleted,
    total_storage_freed_mb = admin_cleanup_stats.total_storage_freed_mb + v_storage_freed,
    avg_execution_time_ms = (admin_cleanup_stats.avg_execution_time_ms + v_execution_time) / 2,
    error_count = admin_cleanup_stats.error_count + CASE WHEN v_success THEN 0 ELSE 1 END,
    success_count = admin_cleanup_stats.success_count + CASE WHEN v_success THEN 1 ELSE 0 END,
    bin_items_deleted = admin_cleanup_stats.bin_items_deleted + v_bin_items_cleaned,
    bin_listings_cleaned = admin_cleanup_stats.bin_listings_cleaned + v_listings_deleted,
    bin_wanted_requests_cleaned = admin_cleanup_stats.bin_wanted_requests_cleaned + v_wanted_deleted,
    bin_storage_freed_mb = admin_cleanup_stats.bin_storage_freed_mb + (v_storage_freed * 0.6),
    last_cleanup_at = CURRENT_TIMESTAMP;

  -- Log the cleanup action
  INSERT INTO cleanup_logs (
    cleanup_type,
    records_affected,
    execution_time_ms,
    success,
    error_message,
    metadata
  ) VALUES (
    'bin_cleanup',
    v_total_deleted,
    v_execution_time,
    v_success,
    v_error_message,
    jsonb_build_object(
      'listings_deleted', v_listings_deleted,
      'wanted_requests_deleted', v_wanted_deleted,
      'business_profiles_deleted', v_business_deleted,
      'bin_items_cleaned', v_bin_items_cleaned,
      'storage_freed_mb', v_storage_freed
    )
  );

  -- Return results
  RETURN QUERY SELECT
    v_total_deleted,
    v_listings_deleted,
    v_wanted_deleted,
    v_business_deleted,
    v_bin_items_cleaned,
    v_storage_freed,
    v_execution_time,
    CURRENT_DATE,
    v_success,
    v_error_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comprehensive bin statistics for admin dashboard
CREATE OR REPLACE FUNCTION get_admin_bin_statistics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_bin_items INTEGER,
  bin_listings_count INTEGER,
  bin_wanted_requests_count INTEGER,
  recent_bin_additions INTEGER,
  items_expiring_soon INTEGER,
  avg_days_in_bin NUMERIC,
  total_bin_storage_mb NUMERIC,
  cleanup_stats JSONB,
  user_activity JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH bin_summary AS (
    SELECT * FROM admin_bin_stats
  ),
  cleanup_history AS (
    SELECT 
      SUM(bin_items_deleted) as total_cleaned,
      SUM(bin_storage_freed_mb) as total_storage_cleaned,
      AVG(bin_items_deleted) as avg_daily_cleanup,
      COUNT(*) as cleanup_days
    FROM admin_cleanup_stats
    WHERE cleanup_date >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ),
  user_bin_activity AS (
    SELECT
      COUNT(DISTINCT CASE WHEN dl.deleted_at >= CURRENT_DATE - INTERVAL '7 days' THEN dl.user_id END) +
      COUNT(DISTINCT CASE WHEN dwr.deleted_at >= CURRENT_DATE - INTERVAL '7 days' THEN dwr.user_id END) as active_users_week,
      COUNT(DISTINCT dl.user_id) + COUNT(DISTINCT dwr.user_id) as total_users_with_bin_items
    FROM deleted_listings dl
    FULL OUTER JOIN deleted_wanted_requests dwr ON false
  )
  SELECT
    bs.total_bin_items::INTEGER,
    bs.bin_listings_count::INTEGER,
    bs.bin_wanted_requests_count::INTEGER,
    bs.recent_bin_additions::INTEGER,
    bs.items_expiring_soon::INTEGER,
    ROUND((COALESCE(bs.avg_days_in_bin_listings, 0) + COALESCE(bs.avg_days_in_bin_wanted, 0)) / 2, 1) as avg_days_in_bin,
    -- Estimate total storage: listings(1.5KB) + wanted(0.55KB)
    ROUND((bs.bin_listings_count * 1.5 + bs.bin_wanted_requests_count * 0.55) / 1024, 2) as total_bin_storage_mb,
    jsonb_build_object(
      'total_items_cleaned', ch.total_cleaned,
      'total_storage_cleaned_mb', ROUND(ch.total_storage_cleaned, 2),
      'avg_daily_cleanup', ROUND(ch.avg_daily_cleanup, 1),
      'cleanup_days_tracked', ch.cleanup_days
    ) as cleanup_stats,
    jsonb_build_object(
      'active_users_this_week', uba.active_users_week,
      'total_users_with_bin_items', uba.total_users_with_bin_items
    ) as user_activity
  FROM bin_summary bs, cleanup_history ch, user_bin_activity uba;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to trigger manual bin cleanup for admin
CREATE OR REPLACE FUNCTION admin_trigger_bin_cleanup()
RETURNS TABLE (
  success BOOLEAN,
  items_cleaned INTEGER,
  storage_freed_mb NUMERIC,
  execution_time_ms INTEGER,
  message TEXT
) AS $$
DECLARE
  cleanup_result RECORD;
BEGIN
  -- Call the enhanced cleanup function
  SELECT * INTO cleanup_result
  FROM cleanup_old_deleted_records_monitored()
  LIMIT 1;
  
  RETURN QUERY SELECT
    cleanup_result.success,
    cleanup_result.bin_items_cleaned,
    cleanup_result.storage_freed_mb,
    cleanup_result.execution_time_ms,
    CASE 
      WHEN cleanup_result.success THEN 
        'Bin cleanup completed successfully. Cleaned ' || cleanup_result.bin_items_cleaned || ' items, freed ' || ROUND(cleanup_result.storage_freed_mb, 2) || ' MB'
      ELSE 
        'Bin cleanup failed: ' || COALESCE(cleanup_result.error_message, 'Unknown error')
    END as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_bin_statistics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_trigger_bin_cleanup() TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_cleanup_stats_bin_items ON admin_cleanup_stats(bin_items_deleted DESC) WHERE bin_items_deleted > 0;
CREATE INDEX IF NOT EXISTS idx_admin_cleanup_stats_bin_storage ON admin_cleanup_stats(bin_storage_freed_mb DESC) WHERE bin_storage_freed_mb > 0;

-- Update existing alert system to include bin alerts
INSERT INTO admin_alert_config (alert_type, is_enabled, email_recipients, threshold_value) VALUES
('bin_overflow', true, ARRAY['admin@yourdomain.com'], 1000), -- Alert if bin has > 1000 items
('bin_low_cleanup', true, ARRAY['admin@yourdomain.com'], 50) -- Alert if daily bin cleanup < 50 items
ON CONFLICT (alert_type) DO NOTHING;

-- Update alert checking function to include bin metrics
CREATE OR REPLACE FUNCTION check_and_trigger_alerts()
RETURNS TEXT AS $$
DECLARE
  alert_record RECORD;
  cleanup_stats RECORD;
  bin_stats RECORD;
  error_rate NUMERIC;
  storage_freed NUMERIC;
  expiring_count INTEGER;
  bin_item_count INTEGER;
  bin_cleanup_count INTEGER;
  alert_message TEXT;
  recipients TEXT[];
BEGIN
  -- Check cleanup failure alerts (existing logic)
  SELECT * INTO cleanup_stats 
  FROM admin_cleanup_stats 
  WHERE cleanup_date >= CURRENT_DATE - INTERVAL '1 day'
  ORDER BY cleanup_date DESC 
  LIMIT 1;

  IF cleanup_stats IS NOT NULL THEN
    -- Check for high error rate
    IF cleanup_stats.cleanup_runs > 0 THEN
      error_rate := (cleanup_stats.error_count::NUMERIC / cleanup_stats.cleanup_runs::NUMERIC) * 100;
      
      SELECT * INTO alert_record FROM admin_alert_config 
      WHERE alert_type = 'high_error_rate' AND is_enabled = true;
      
      IF alert_record IS NOT NULL AND error_rate > alert_record.threshold_value THEN
        INSERT INTO admin_alert_log (alert_type, message, recipients, data)
        VALUES (
          'high_error_rate',
          'High cleanup error rate detected: ' || ROUND(error_rate, 2) || '% (' || 
          cleanup_stats.error_count || ' errors out of ' || cleanup_stats.cleanup_runs || ' runs)',
          alert_record.email_recipients,
          jsonb_build_object(
            'error_rate', error_rate,
            'error_count', cleanup_stats.error_count,
            'total_runs', cleanup_stats.cleanup_runs,
            'date', cleanup_stats.cleanup_date
          )
        );
      END IF;
    END IF;

    -- Check for low storage freed
    SELECT * INTO alert_record FROM admin_alert_config 
    WHERE alert_type = 'storage_threshold' AND is_enabled = true;
    
    IF alert_record IS NOT NULL AND cleanup_stats.total_storage_freed_mb < alert_record.threshold_value THEN
      INSERT INTO admin_alert_log (alert_type, message, recipients, data)
      VALUES (
        'storage_threshold',
        'Low storage cleanup detected: Only ' || cleanup_stats.total_storage_freed_mb || 
        ' MB freed (threshold: ' || alert_record.threshold_value || ' MB)',
        alert_record.email_recipients,
        jsonb_build_object(
          'storage_freed_mb', cleanup_stats.total_storage_freed_mb,
          'threshold_mb', alert_record.threshold_value,
          'date', cleanup_stats.cleanup_date
        )
      );
    END IF;

    -- Check for low bin cleanup activity
    SELECT * INTO alert_record FROM admin_alert_config 
    WHERE alert_type = 'bin_low_cleanup' AND is_enabled = true;
    
    IF alert_record IS NOT NULL AND COALESCE(cleanup_stats.bin_items_deleted, 0) < alert_record.threshold_value THEN
      INSERT INTO admin_alert_log (alert_type, message, recipients, data)
      VALUES (
        'bin_low_cleanup',
        'Low bin cleanup activity: Only ' || COALESCE(cleanup_stats.bin_items_deleted, 0) || 
        ' bin items cleaned (threshold: ' || alert_record.threshold_value || ')',
        alert_record.email_recipients,
        jsonb_build_object(
          'bin_items_cleaned', COALESCE(cleanup_stats.bin_items_deleted, 0),
          'threshold', alert_record.threshold_value,
          'date', cleanup_stats.cleanup_date
        )
      );
    END IF;
  END IF;

  -- Check bin overflow
  SELECT * INTO bin_stats FROM admin_bin_stats;
  SELECT * INTO alert_record FROM admin_alert_config 
  WHERE alert_type = 'bin_overflow' AND is_enabled = true;

  IF alert_record IS NOT NULL AND bin_stats.total_bin_items > alert_record.threshold_value THEN
    INSERT INTO admin_alert_log (alert_type, message, recipients, data)
    VALUES (
      'bin_overflow',
      'Bin overflow detected: ' || bin_stats.total_bin_items || 
      ' items in bin (threshold: ' || alert_record.threshold_value || ')',
      alert_record.email_recipients,
      jsonb_build_object(
        'total_bin_items', bin_stats.total_bin_items,
        'threshold', alert_record.threshold_value,
        'listings_count', bin_stats.bin_listings_count,
        'wanted_requests_count', bin_stats.bin_wanted_requests_count
      )
    );
  END IF;

  -- Check for expiring recovery profiles (existing logic)
  SELECT * INTO alert_record FROM admin_alert_config 
  WHERE alert_type = 'recovery_expiring' AND is_enabled = true;

  IF alert_record IS NOT NULL THEN
    SELECT COUNT(*) INTO expiring_count
    FROM admin_business_recovery_eligible
    WHERE days_remaining <= alert_record.threshold_value;
    
    IF expiring_count > 0 THEN
      INSERT INTO admin_alert_log (alert_type, message, recipients, data)
      VALUES (
        'recovery_expiring',
        expiring_count || ' business profile(s) expiring within ' || 
        alert_record.threshold_value || ' days',
        alert_record.email_recipients,
        jsonb_build_object(
          'expiring_count', expiring_count,
          'threshold_days', alert_record.threshold_value
        )
      );
    END IF;
  END IF;

  RETURN 'Alert check completed at ' || NOW() || '. Checked cleanup, bin, and recovery metrics.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_admin_bin_statistics(INTEGER) IS 'Returns comprehensive bin statistics for admin dashboard monitoring';
COMMENT ON FUNCTION admin_trigger_bin_cleanup() IS 'Manually trigger bin cleanup and return results for admin dashboard';
COMMENT ON VIEW admin_bin_stats IS 'Real-time view of bin statistics for monitoring dashboard';
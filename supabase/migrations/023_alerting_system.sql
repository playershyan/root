-- Add alerting system for cleanup failures
-- This migration adds email alerting for cleanup failures and critical issues

-- Create admin alert configuration table
CREATE TABLE IF NOT EXISTS admin_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('cleanup_failure', 'high_error_rate', 'storage_threshold', 'recovery_expiring')),
  is_enabled BOOLEAN DEFAULT true,
  email_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
  threshold_value NUMERIC DEFAULT NULL, -- for thresholds like error rate or storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default alert configurations
INSERT INTO admin_alert_config (alert_type, is_enabled, email_recipients, threshold_value) VALUES
('cleanup_failure', true, ARRAY['admin@yourdomain.com'], NULL),
('high_error_rate', true, ARRAY['admin@yourdomain.com'], 50), -- Alert if error rate > 50%
('storage_threshold', true, ARRAY['admin@yourdomain.com'], 1000), -- Alert if daily storage freed < 1GB
('recovery_expiring', true, ARRAY['admin@yourdomain.com'], 3) -- Alert for profiles expiring in 3 days
ON CONFLICT DO NOTHING;

-- Create alert log table to track sent alerts
CREATE TABLE IF NOT EXISTS admin_alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message TEXT NOT NULL,
  recipients TEXT[],
  data JSONB DEFAULT '{}',
  sent_successfully BOOLEAN DEFAULT false
);

-- Enable RLS on alert tables
ALTER TABLE admin_alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alert_log ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admin can manage alert config" ON admin_alert_config
FOR ALL TO authenticated
USING (
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' 
  OR auth.jwt() ->> 'email' LIKE '%@yourdomain.com'
);

CREATE POLICY "Admin can view alert logs" ON admin_alert_log
FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin' 
  OR auth.jwt() ->> 'email' LIKE '%@yourdomain.com'
);

-- Function to check and trigger alerts
CREATE OR REPLACE FUNCTION check_and_trigger_alerts()
RETURNS TEXT AS $$
DECLARE
  alert_record RECORD;
  cleanup_stats RECORD;
  error_rate NUMERIC;
  storage_freed NUMERIC;
  expiring_count INTEGER;
  alert_message TEXT;
  recipients TEXT[];
BEGIN
  -- Check cleanup failure alerts
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
  END IF;

  -- Check for expiring recovery profiles
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

  RETURN 'Alert check completed at ' || NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent alerts for admin dashboard
CREATE OR REPLACE FUNCTION get_recent_alerts(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  alert_type TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE,
  message TEXT,
  data JSONB,
  sent_successfully BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.alert_type,
    a.triggered_at,
    a.message,
    a.data,
    a.sent_successfully
  FROM admin_alert_log a
  WHERE a.triggered_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
  ORDER BY a.triggered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_alert_log_triggered_at ON admin_alert_log(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_log_type ON admin_alert_log(alert_type);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_trigger_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_alerts(INTEGER) TO authenticated;

COMMENT ON TABLE admin_alert_config IS 'Configuration for automated admin alerts';
COMMENT ON TABLE admin_alert_log IS 'Log of triggered admin alerts';
COMMENT ON FUNCTION check_and_trigger_alerts() IS 'Checks conditions and triggers alerts when thresholds are exceeded';
COMMENT ON FUNCTION get_recent_alerts(INTEGER) IS 'Returns recent alerts for admin dashboard display';
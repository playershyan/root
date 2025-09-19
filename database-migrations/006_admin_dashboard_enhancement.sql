-- Enhanced Admin Dashboard Database Migration
-- This migration enhances the admin system with comprehensive tracking and monitoring

-- 1. Enhance admin_users table with more granular permissions
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS dashboard_preferences jsonb DEFAULT '{}';

-- 2. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id uuid REFERENCES admin_users(user_id),
    action_type varchar(100) NOT NULL,
    action_details jsonb,
    affected_table varchar(100),
    affected_record_id uuid,
    ip_address inet,
    user_agent text,
    performed_at timestamp with time zone DEFAULT now(),
    success boolean DEFAULT true,
    error_message text,
    duration_ms integer
);

-- 3. Create system alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type varchar(50) NOT NULL CHECK (alert_type IN ('error', 'warning', 'info', 'success')),
    title varchar(255) NOT NULL,
    message text NOT NULL,
    severity integer DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),
    source varchar(100),
    metadata jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    read_by uuid REFERENCES admin_users(user_id),
    read_at timestamp with time zone,
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid REFERENCES admin_users(user_id),
    acknowledged_at timestamp with time zone,
    auto_resolved boolean DEFAULT false,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + interval '30 days')
);

-- 4. Create admin dashboard metrics table
CREATE TABLE IF NOT EXISTS admin_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type varchar(50) NOT NULL,
    metric_name varchar(100) NOT NULL,
    metric_value numeric,
    metric_data jsonb DEFAULT '{}',
    period_start timestamp with time zone NOT NULL,
    period_end timestamp with time zone NOT NULL,
    calculated_at timestamp with time zone DEFAULT now(),
    UNIQUE(metric_type, metric_name, period_start, period_end)
);

-- 5. Create admin notifications preferences
CREATE TABLE IF NOT EXISTS admin_notification_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id uuid REFERENCES admin_users(user_id) UNIQUE,
    email_enabled boolean DEFAULT true,
    email_address text,
    alert_types jsonb DEFAULT '["error", "warning"]',
    daily_summary boolean DEFAULT true,
    weekly_report boolean DEFAULT true,
    instant_critical boolean DEFAULT true,
    quiet_hours_start time,
    quiet_hours_end time,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. Create cron job monitoring table
CREATE TABLE IF NOT EXISTS cron_monitoring (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_name varchar(100) NOT NULL,
    schedule varchar(50) NOT NULL,
    last_run_at timestamp with time zone,
    last_run_status varchar(20) CHECK (last_run_status IN ('success', 'failure', 'running', 'skipped')),
    last_run_duration_ms integer,
    next_run_at timestamp with time zone,
    consecutive_failures integer DEFAULT 0,
    total_runs integer DEFAULT 0,
    total_failures integer DEFAULT 0,
    average_duration_ms integer,
    is_enabled boolean DEFAULT true,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. Create data cleanup audit table
CREATE TABLE IF NOT EXISTS data_cleanup_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cleanup_type varchar(50) NOT NULL,
    tables_affected jsonb NOT NULL,
    records_deleted integer DEFAULT 0,
    records_archived integer DEFAULT 0,
    storage_freed_mb numeric,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    status varchar(20) CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    initiated_by uuid REFERENCES admin_users(user_id),
    error_details text,
    rollback_available boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. Create admin quick actions table
CREATE TABLE IF NOT EXISTS admin_quick_actions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action_name varchar(100) NOT NULL,
    action_type varchar(50) NOT NULL,
    action_query text,
    action_params jsonb DEFAULT '{}',
    description text,
    icon varchar(50),
    color varchar(20),
    requires_confirmation boolean DEFAULT true,
    permission_required varchar(100),
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone,
    last_used_by uuid REFERENCES admin_users(user_id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES admin_users(user_id)
);

-- 9. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_performed_at ON admin_activity_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action_type ON admin_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_system_alerts_alert_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_calculated_at ON admin_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_metrics_type_name ON admin_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_cron_monitoring_job_name ON cron_monitoring(job_name);
CREATE INDEX IF NOT EXISTS idx_data_cleanup_audit_completed_at ON data_cleanup_audit(completed_at DESC);

-- 10. Functions for admin dashboard

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_id uuid,
    p_action_type varchar,
    p_details jsonb DEFAULT '{}',
    p_table varchar DEFAULT NULL,
    p_record_id uuid DEFAULT NULL,
    p_ip inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
    v_activity_id uuid;
BEGIN
    INSERT INTO admin_activity_log (
        admin_user_id, action_type, action_details,
        affected_table, affected_record_id, ip_address, user_agent
    ) VALUES (
        p_admin_id, p_action_type, p_details,
        p_table, p_record_id, p_ip, p_user_agent
    ) RETURNING id INTO v_activity_id;

    -- Update last login if this is a login action
    IF p_action_type = 'login' THEN
        UPDATE admin_users
        SET last_login = now(),
            login_count = COALESCE(login_count, 0) + 1
        WHERE user_id = p_admin_id;
    END IF;

    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create system alert
CREATE OR REPLACE FUNCTION create_system_alert(
    p_type varchar,
    p_title varchar,
    p_message text,
    p_severity integer DEFAULT 1,
    p_metadata jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
    v_alert_id uuid;
BEGIN
    INSERT INTO system_alerts (
        alert_type, title, message, severity, metadata
    ) VALUES (
        p_type, p_title, p_message, p_severity, p_metadata
    ) RETURNING id INTO v_alert_id;

    -- TODO: Trigger notification system here if needed

    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate dashboard metrics
CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(
    p_period_start timestamp with time zone DEFAULT (now() - interval '24 hours'),
    p_period_end timestamp with time zone DEFAULT now()
) RETURNS jsonb AS $$
DECLARE
    v_metrics jsonb;
BEGIN
    WITH metrics AS (
        SELECT
            (SELECT COUNT(*) FROM listings WHERE created_at BETWEEN p_period_start AND p_period_end) as new_listings,
            (SELECT COUNT(*) FROM profiles WHERE created_at BETWEEN p_period_start AND p_period_end) as new_users,
            (SELECT COUNT(*) FROM listings WHERE status = 'pending') as pending_listings,
            (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
            (SELECT COUNT(*) FROM listings WHERE status = 'active') as active_listings,
            (SELECT COUNT(*) FROM profiles) as total_users,
            (SELECT COUNT(*) FROM business_profiles WHERE is_verified = false) as pending_business,
            (SELECT COUNT(*) FROM business_profiles WHERE is_verified = true) as verified_business
    )
    SELECT to_jsonb(metrics.*) INTO v_metrics FROM metrics;

    -- Store metrics in the table
    INSERT INTO admin_metrics (
        metric_type, metric_name, metric_data, period_start, period_end
    ) VALUES (
        'dashboard', 'summary', v_metrics, p_period_start, p_period_end
    ) ON CONFLICT (metric_type, metric_name, period_start, period_end)
    DO UPDATE SET metric_data = v_metrics, calculated_at = now();

    RETURN v_metrics;
END;
$$ LANGUAGE plpgsql;

-- Function to get recent admin activity
CREATE OR REPLACE FUNCTION get_recent_admin_activity(
    p_limit integer DEFAULT 50
) RETURNS TABLE (
    id uuid,
    admin_email text,
    action_type varchar,
    action_details jsonb,
    affected_table varchar,
    affected_record_id uuid,
    performed_at timestamp with time zone
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        aal.id,
        u.email as admin_email,
        aal.action_type,
        aal.action_details,
        aal.affected_table,
        aal.affected_record_id,
        aal.performed_at
    FROM admin_activity_log aal
    LEFT JOIN auth.users u ON u.id = aal.admin_user_id
    ORDER BY aal.performed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 11. Row Level Security Policies
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_cleanup_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_quick_actions ENABLE ROW LEVEL SECURITY;

-- Admin users can read all activity logs
CREATE POLICY admin_activity_log_read ON admin_activity_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admin users can manage system alerts
CREATE POLICY system_alerts_admin ON system_alerts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admin users can view metrics
CREATE POLICY admin_metrics_read ON admin_metrics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- 12. Initial data setup

-- Insert default admin notification preferences for existing admin users
INSERT INTO admin_notification_preferences (admin_user_id)
SELECT user_id FROM admin_users
WHERE NOT EXISTS (
    SELECT 1 FROM admin_notification_preferences anp
    WHERE anp.admin_user_id = admin_users.user_id
);

-- Insert default cron jobs to monitor
INSERT INTO cron_monitoring (job_name, schedule, is_enabled) VALUES
    ('promotions_expire', '0 * * * *', true),
    ('promotions_boost', '0 0 * * *', true),
    ('promotions_rotation', '0 0 * * *', true),
    ('template_generation', '0 2 30 * *', true)
ON CONFLICT DO NOTHING;

-- Create initial system alert
SELECT create_system_alert(
    'info',
    'Admin Dashboard Enhanced',
    'The admin dashboard has been upgraded with new monitoring and analytics features.',
    1,
    '{"source": "migration"}'::jsonb
);

-- Grant permissions to authenticated users (will be filtered by RLS)
GRANT SELECT ON admin_activity_log TO authenticated;
GRANT ALL ON system_alerts TO authenticated;
GRANT SELECT ON admin_metrics TO authenticated;
GRANT ALL ON admin_notification_preferences TO authenticated;
GRANT SELECT ON cron_monitoring TO authenticated;
GRANT SELECT ON data_cleanup_audit TO authenticated;
GRANT SELECT ON admin_quick_actions TO authenticated;
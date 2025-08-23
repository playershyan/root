-- Supabase Cron Jobs Configuration
-- This file sets up scheduled jobs for automatic maintenance

-- Install pg_cron extension if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily cleanup of soft-deleted items older than 30 days
-- Runs every day at 2:00 AM UTC
SELECT cron.schedule(
    'cleanup-deleted-items', -- job name
    '0 2 * * *', -- cron expression (daily at 2:00 AM UTC)
    $$
    SELECT permanently_delete_old_records();
    $$
);

-- Optional: Schedule a weekly summary of pending deletions
-- Runs every Monday at 9:00 AM UTC
SELECT cron.schedule(
    'deletion-summary', -- job name  
    '0 9 * * 1', -- cron expression (Monday at 9:00 AM UTC)
    $$
    INSERT INTO deletion_logs (
        table_name,
        record_id,
        deletion_reason,
        record_data
    )
    SELECT 
        'summary',
        gen_random_uuid(),
        'Weekly deletion summary',
        jsonb_build_object(
            'pending_listings', (SELECT COUNT(*) FROM listings WHERE deleted_at IS NOT NULL AND permanently_deleted = false),
            'pending_wanted_requests', (SELECT COUNT(*) FROM wanted_requests WHERE deleted_at IS NOT NULL AND permanently_deleted = false),
            'overdue_items', (SELECT COUNT(*) FROM pending_permanent_deletion WHERE deletion_status = 'overdue'),
            'imminent_items', (SELECT COUNT(*) FROM pending_permanent_deletion WHERE deletion_status = 'imminent'),
            'timestamp', NOW()
        );
    $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- To unschedule a job (if needed):
-- SELECT cron.unschedule('cleanup-deleted-items');
-- SELECT cron.unschedule('deletion-summary');
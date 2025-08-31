-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup of deleted records older than 30 days
-- Runs every day at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-deleted-records',  -- Job name
  '0 2 * * *',                -- Cron expression (daily at 2 AM)
  $$SELECT public.cleanup_old_deleted_records();$$
);

-- Optional: View scheduled jobs
-- SELECT * FROM cron.job;

-- Optional: Remove the scheduled job
-- SELECT cron.unschedule('cleanup-deleted-records');

-- Add comment for documentation
COMMENT ON EXTENSION pg_cron IS 'Scheduled job runner for automatic cleanup of old deleted records';
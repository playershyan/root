-- Migration: Remove wanted request matching notifications system
-- Description: Removes table, functions, policies, indexes, and columns related to listing-wanted request matching notifications
-- This rolls back migration 0021_wanted_request_matching_notifications.sql

-- Drop functions first (they reference the table)
DROP FUNCTION IF EXISTS cleanup_old_dismissed_notifications() CASCADE;
DROP FUNCTION IF EXISTS get_active_notification_count() CASCADE;
DROP FUNCTION IF EXISTS increment_wanted_request_match_counts(uuid[]) CASCADE;

-- Drop RLS policies on listing_wanted_notifications table
DROP POLICY IF EXISTS "Anyone can read active notifications" ON listing_wanted_notifications;
DROP POLICY IF EXISTS "Authenticated users can dismiss notifications" ON listing_wanted_notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON listing_wanted_notifications;

-- Drop indexes on listing_wanted_notifications table
DROP INDEX IF EXISTS idx_listing_wanted_notifications_active;
DROP INDEX IF EXISTS idx_listing_wanted_notifications_listing_id;
DROP INDEX IF EXISTS idx_listing_wanted_notifications_created_at;

-- Drop the listing_wanted_notifications table
DROP TABLE IF EXISTS listing_wanted_notifications CASCADE;

-- Remove columns from wanted_requests table that were added for match tracking
ALTER TABLE wanted_requests DROP COLUMN IF EXISTS new_matches_count;
ALTER TABLE wanted_requests DROP COLUMN IF EXISTS last_match_notification;


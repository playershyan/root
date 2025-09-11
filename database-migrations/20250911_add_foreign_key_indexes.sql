-- Add missing foreign key indexes for performance optimization
-- Addresses 27 unindexed foreign key constraints identified by Supabase Performance Advisor

-- High-frequency user-facing tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_listing_id ON public.notifications(listing_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_conversation_id ON public.notifications(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_wanted_request_id ON public.notifications(wanted_request_id);

-- Transaction-critical messaging system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_conversation_id ON public.offers(conversation_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_sender_id ON public.offers(sender_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_responded_by ON public.offers(responded_by);

-- Core marketplace functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wanted_requests_user_id ON public.wanted_requests(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wanted_requests_approved_by ON public.wanted_requests(approved_by);

-- Session and activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_activity_session_id ON public.session_activity(session_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_activity_user_id ON public.session_activity(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listing_views_listing_id ON public.listing_views(listing_id);

-- Alert and reporting systems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alerts_wanted_request_id ON public.alerts(wanted_request_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_reviewed_by ON public.reports(reviewed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reports_wanted_request_id ON public.reports(wanted_request_id);

-- Promotion system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_promotion_rotations_promotion_id ON public.promotion_rotations(promotion_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_promotion_rotations_listing_id ON public.promotion_rotations(listing_id);

-- Admin and audit operations (lower frequency, but still beneficial)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_created_by ON public.admin_users(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_approved_by ON public.listings(approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_log_performed_by ON public.security_audit_log(performed_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_revoked_by ON public.user_sessions(revoked_by);

-- Deletion system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deletion_approval_requests_approved_by ON public.deletion_approval_requests(approved_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deletion_backups_restored_by ON public.deletion_backups(restored_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deletion_safety_config_updated_by ON public.deletion_safety_config(updated_by);

-- Remove unused indexes that consume storage without benefit
DROP INDEX CONCURRENTLY IF EXISTS idx_offers_listing_id_fk;
DROP INDEX CONCURRENTLY IF EXISTS idx_alerts_listing_id_fk;
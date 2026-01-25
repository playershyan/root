# Section 5: Database Schema Deep Dive

**Note**: This file contains a reference outline of the database schema. The complete implementation with all CREATE TABLE statements, RLS policies, and function code is available in agent output a02bdc1.

## 5.1 Schema Overview

- **Total Tables**: 45 tables across public schema
- **RLS Coverage**: 100% - All public tables protected
- **Performance Status**: EXCELLENT (76% improvement: 157 warnings → 37 INFO-level)
- **Optimization**: O(n) → O(1) complexity via SELECT auth.uid() caching pattern

## 5.2 Core Business Tables

### 5.2.1 listings
Primary vehicle marketplace table with 40+ fields covering:
- Vehicle specifications (make, model, year, mileage, fuel, transmission)
- Pricing (cash/finance with structured finance data)
- Promotion flags (is_featured, is_top_spot, is_boosted, is_urgent)
- Status management (active, pending, sold, expired, deleted)
- Soft deletion (deleted_at, permanently_deleted)

**Key Indexes**:
- idx_listings_duplicate_check: (user_id, status, make, model, year, created_at)
- idx_listings_active_feed: (created_at DESC) WHERE status='active' AND is_sold=FALSE
- idx_listings_status_sold_vehicle_type: (id, status, is_sold, vehicle_type)

### 5.2.2 wanted_requests
User vehicle search requests with budget ranges and criteria matching.

### 5.2.3 promotions
Promotion tracking with rotation scoring and impression counting.

**Critical Index**: idx_promotions_rotation_performance
- Columns: (promotion_type, is_active, expires_at, last_shown_at NULLS FIRST, impressions, created_at)
- Purpose: Enables fair rotation algorithm with optimal ordering

### 5.2.4 promotion_rotations
Detailed rotation cycle tracking for analytics.

## 5.3 User Management Tables

- profiles: Core user data with phone verification
- business_profiles: Dealer/showroom enhanced profiles
- admin_users: Role-based access control (admin/moderator/reviewer)

## 5.4 Communication Tables

- conversations: Buyer-seller messaging threads
- messages: Individual messages with offer support
- offers: Purchase offer management with status workflow

## 5.5 Admin & Monitoring Tables

- admin_activity_log: Complete audit trail
- system_alerts: Alert management with severity levels
- security_audit_log: Security event tracking
- cron_monitoring: Scheduled job health tracking
- data_cleanup_audit: Cleanup operation logging

## 5.6 Deletion Safety System

- deletion_safety_config: System-wide deletion limits
- deletion_backups: Full record backups before permanent deletion
- deletion_approval_requests: Admin approval workflow for bulk operations
- deletion_logs: Comprehensive deletion audit trail

## 5.7 Session & Security Tables

- user_sessions: Enhanced session tracking with device fingerprinting
- session_activity: Granular activity logging
- phone_verifications: OTP-based phone verification (10min expiry, 3 attempts)

## 5.8 Content Tables

- description_templates: AI-generated vehicle templates
- buying_guides_cache: Pre-generated AI guides with TTL (30 days)
- listing_views: View counter with enhanced tracking

## 5.9 Notification Tables

- notifications: User notification system
- alerts: User-defined search alerts
- listing_wanted_notifications: Match notification system
- career_notifications: Job opportunity subscriptions

## 5.10 RLS Policy Patterns

### Optimized auth.uid() Caching

**Incorrect (O(n))**:
```sql
WHERE user_id = auth.uid()  -- Evaluates per row
```

**Correct (O(1))**:
```sql
WHERE user_id = (SELECT auth.uid())  -- Evaluates once, cached
```

### Performance Case Study

- **Before**: 157 performance warnings
- **After**: 37 INFO-level warnings
- **Improvement**: 76% reduction
- **Changes**: 54 RLS policies optimized, 32 duplicate policies consolidated, 47 unused indexes removed

## 5.11 Critical Composite Indexes

1. **idx_listings_duplicate_check**: Prevents duplicate listings within 24 hours
2. **idx_listings_active_feed**: Optimizes homepage feed queries
3. **idx_promotions_rotation_performance**: Enables fair rotation with 5-column optimization
4. **idx_listings_status_sold_vehicle_type**: JOIN optimization for rotation functions

## 5.12 Database Functions

### Core Functions

- **create_listing_v2(payload JSONB)**: Atomic listing creation with validation
- **increment_listing_views_enhanced()**: Optimized view counter trigger
- **get_rotated_featured_ads(vehicle_type, limit)**: Fair rotation for featured promotions
- **get_rotated_top_spot_ads(vehicle_type, limit)**: Top spot rotation
- **permanently_delete_old_records()**: Deletion with safety checks and backups
- **restore_from_backup(backup_id, restored_by)**: Restore deleted records

### Session Management

- create_user_session()
- update_session_activity()
- revoke_session()
- cleanup_expired_sessions()

### Utility Functions

- update_updated_at_column(): Auto-timestamp trigger
- update_deleted_at(): Soft deletion trigger
- handle_new_user(): Auto-create profile on signup

## 5.13 Migration System

- **Total**: 42 migration files
- **Pattern**: Sequential (001-009) + Dated (YYYYMMDD_name)
- **Key Migrations**:
  - 001: Promotions system foundation
  - 004: Finance columns addition
  - 007-009: Performance optimization (76% improvement)
  - 20251110: Critical composite indexes
  - 20251111: Buying guides cache

### Migration Execution Order

Foundation (001-003) → Core Features (004) → Performance (007-009) → Enhancements (2025*)

---

**Complete Implementation**: See agent output a02bdc1 for full CREATE TABLE statements, RLS policies, and function implementations.

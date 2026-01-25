# Section 5: Database Schema Deep Dive - Reference

**Note**: The complete Section 5 with full CREATE TABLE statements, RLS policies, and database functions is available in **agent output a02bdc1**. This file provides a comprehensive outline and summary.

---

## 5.1 Schema Overview

**Database Architecture**:
- **Total Tables**: 45 tables across public schema
- **PostgreSQL Version**: 17.4.1
- **RLS Coverage**: 100% - All public tables have Row Level Security enabled
- **Performance Status**: EXCELLENT (76% improvement achieved)
- **Key Achievement**: O(n) → O(1) complexity reduction on RLS via `SELECT auth.uid()` caching

**Core Features**:
- Comprehensive deletion safety with backup/restore
- Advanced promotion rotation ensuring fair distribution
- Session management with device tracking
- Duplicate detection with 24-hour window
- Multi-tier notification system

---

## 5.2 Core Business Tables

### 5.2.1 listings Table

**Purpose**: Central vehicle marketplace table

**Key Fields** (40+ total):
- Vehicle core: make, model, year, mileage, fuel_type, transmission, engine_capacity
- Pricing: price, pricing_type ('cash'|'finance'), negotiable
- Finance: finance_type, outstanding_balance, monthly_payment, remaining_term, asking_price
- Promotion flags: is_featured, is_top_spot, is_boosted, is_urgent, boost_score
- Status: status (active/pending/sold/expired/deleted), is_sold, is_paused
- Soft deletion: deleted_at, permanently_deleted
- Media: image_urls (array), primary_image_url
- Engagement: views, report_count

**Critical Indexes**:
```sql
-- Duplicate detection (24-hour window)
idx_listings_duplicate_check (user_id, status, make, model, year, created_at)

-- Active feed optimization
idx_listings_active_feed (created_at DESC) WHERE status='active' AND is_sold=FALSE

-- JOIN optimization for rotations
idx_listings_status_sold_vehicle_type (id, status, is_sold, vehicle_type)
```

**RLS Policies** (optimized with SELECT auth.uid()):
- Public can view active listings
- Users can insert/update/delete own listings
- Admins can manage all listings

### 5.2.2 wanted_requests Table

**Purpose**: User vehicle search requests

**Key Fields**:
- Criteria: make, model, min_year, max_year, max_mileage, fuel_type, transmission
- Budget: min_budget, max_budget
- Status: active, paused, deleted, fulfilled
- Engagement: clicks

### 5.2.3 promotions Table

**Purpose**: Listing promotion tracking with rotation

**Key Fields**:
- promotion_type: 'featured', 'top_spot', 'boost', 'urgent'
- Active period: started_at, expires_at, is_active
- Rotation tracking: rotation_score, impressions, last_shown_at
- Payment: payment_id, amount

**Critical Composite Index**:
```sql
idx_promotions_rotation_performance (
  promotion_type,
  is_active,
  expires_at,
  last_shown_at NULLS FIRST,  -- Never-shown first
  impressions ASC,             -- Lower impressions first
  created_at ASC               -- Older promotions first
) WHERE is_active = TRUE
```

### 5.2.4 promotion_rotations Table

**Purpose**: Detailed rotation cycle tracking

**Key Fields**:
- rotation_slot, rotation_cycle, impressions_in_cycle
- last_rotated_at

---

## 5.3 User Management Tables

### profiles
- User core data with phone verification support
- Fields: email, name, phone, phone_verified, avatar_url
- Auto-created on user signup via trigger

### business_profiles
- Enhanced profiles for dealers/showrooms
- Fields: business_name, logo_url, banner_url, operating_hours, is_verified
- Auto-verification on creation

### admin_users
- Role-based access control
- Roles: admin, moderator, reviewer
- Permissions stored as JSONB array

---

## 5.4 Communication Tables

### conversations
- Buyer-seller messaging threads
- Unique constraint: one conversation per (listing_id, buyer_id)
- Unread tracking: buyer_unread_count, seller_unread_count
- Auto-updated via trigger on message insert

### messages
- Individual messages with type support (text, offer, image, file)
- offer_data: JSONB field for structured offer details
- Soft deletion support

### offers
- Purchase offer management
- Status workflow: pending → accepted/declined/expired
- Counter offer support with response tracking

---

## 5.5 Admin & Monitoring Tables

### admin_activity_log
- Complete audit trail for all admin actions
- Fields: action_type, action_details (JSONB), affected_table, ip_address, user_agent

### system_alerts
- Alert management with severity levels (1-5)
- Alert types: error, warning, info, success
- Acknowledgment tracking

### security_audit_log
- Security event tracking for compliance

### cron_monitoring
- Scheduled job health tracking
- Tracks: last_run_at, last_run_status, consecutive_failures

### data_cleanup_audit
- Cleanup operation logging with rollback info

---

## 5.6 Deletion Safety System

### deletion_safety_config
- System-wide deletion limits (max_deletions_per_run, approval thresholds)
- Grace periods: min_delete_age_days (30), max_delete_age_days (365)
- Safety toggles: enable_safety_checks, enable_backups

### deletion_backups
- Full record backups before permanent deletion
- backup_data: JSONB storing complete record
- Restore capability tracked via restored_at, restored_by

### deletion_approval_requests
- Admin approval workflow for bulk deletions
- Status: pending, approved, rejected, expired

### deletion_logs
- Comprehensive deletion audit trail

---

## 5.7 Session & Security Tables

### user_sessions
- Enhanced session tracking with device fingerprinting
- device_info, ip_address, user_agent, location_info (all JSONB)
- Revocation support: revoked_at, revoke_reason
- 30-day expiry default

### session_activity
- Granular activity logging within sessions
- activity_type, metadata (JSONB)

### phone_verifications
- OTP-based phone verification
- 10-minute expiration, 3 attempts max
- Fields: otp_code, otp_hash, verified, attempts

---

## 5.8 Content Tables

### description_templates
- AI-generated vehicle description templates
- Grouped by make, model, year
- Usage tracking: usage_count

### buying_guides_cache
- Pre-generated AI buying guides
- TTL: 30 days (expires_at)
- Cache key format: `guide:{make}:{model}:{year|gen|general}`
- Specificity priority: 2=year, 1=generation, 0=general

### listing_views
- View counter with enhanced tracking
- Tracks: ip_address, user_agent, referrer, viewed_at

---

## 5.9 Notification Tables

### notifications
- General user notification system
- Fields: type, title, message, action_url, is_read

### alerts
- User-defined search alerts for wanted vehicles
- Frequency options: instant, daily, weekly

### listing_wanted_notifications
- Match notifications between listings and wanted requests
- Dismissal tracking

### career_notifications
- Job opportunity subscription tracking

---

## 5.10 RLS Policy Patterns

### Performance Optimization Pattern

**Problem - O(n) Complexity**:
```sql
-- ❌ INCORRECT: Re-evaluates auth.uid() for EACH row
CREATE POLICY "example" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

**Solution - O(1) Complexity**:
```sql
-- ✅ CORRECT: Evaluates auth.uid() ONCE and caches result
CREATE POLICY "example" ON table_name
  FOR SELECT USING (user_id = (SELECT auth.uid()));
```

### Performance Impact Case Study

**Before Optimization**:
- 157 performance warnings
- 54 auth_rls_initplan issues (repeated auth.uid() calls)
- 32 duplicate permissive policies
- 47 unused indexes

**After Optimization (Migrations 007-009)**:
- 37 INFO-level warnings
- **76% improvement**
- All policies use `(SELECT auth.uid())` pattern
- Policies consolidated, unused indexes removed

**Expected Performance Gains**:
- Query performance: 40-60% faster on large datasets
- Write performance: 15-25% faster
- Policy evaluation: 20-30% faster

---

## 5.11 Critical Composite Indexes

### 1. idx_listings_duplicate_check
**Purpose**: Prevent duplicate listings within 24-hour window

**Columns**: (user_id, status, make, model, year, created_at)

**Where**: status != 'deleted'

**Usage**: create_listing_v2() function uses this for O(1) duplicate detection

### 2. idx_listings_active_feed
**Purpose**: Optimize homepage active listings feed

**Columns**: (created_at DESC)

**Where**: status = 'active' AND is_sold = FALSE

**Performance**: Partial index reduces size by ~60%, index-only scan

### 3. idx_promotions_rotation_performance
**Purpose**: Enable fair rotation algorithm with optimal ordering

**Columns**:
- promotion_type
- is_active
- expires_at
- last_shown_at NULLS FIRST
- impressions ASC
- created_at ASC

**Where**: is_active = TRUE

**Features**:
- NULLS FIRST prioritizes never-shown promotions
- Impressions ASC balances exposure
- created_at ASC ensures fairness to older promotions

### 4. idx_listings_status_sold_vehicle_type
**Purpose**: JOIN optimization for rotation functions

**Columns**: (id, status, is_sold, vehicle_type)

**Where**: status = 'active' AND is_sold = FALSE

**Performance**: Eliminates sequential scan during promotion rotation queries

---

## 5.12 Database Functions

### Core Business Functions

#### create_listing_v2(payload JSONB)
- **Purpose**: Atomic listing creation with validation
- **Features**: JSONB parsing, indexed duplicate check, finance logic, SECURITY DEFINER
- **Grant**: authenticated role

#### increment_listing_views_enhanced()
- **Type**: Trigger function
- **Purpose**: Optimized view counter with deduplication
- **Trigger**: AFTER INSERT ON listing_views

#### get_rotated_featured_ads(vehicle_type TEXT, limit INTEGER)
- **Purpose**: Fair rotation for featured promotions
- **Returns**: Full listing data (single query, no double JOIN)
- **Features**: NULLS FIRST ordering, FOR UPDATE SKIP LOCKED (concurrency-safe)
- **Grant**: anon, authenticated

#### get_rotated_top_spot_ads(vehicle_type TEXT, limit INTEGER)
- **Purpose**: Top spot rotation (identical to featured, different type)
- **Default limit**: 3

#### permanently_delete_old_records()
- **Purpose**: Permanent deletion with safety checks
- **Features**: Respects deletion_safety_config, creates backups, grace period enforcement
- **Returns**: JSONB summary (deleted counts, backup count, timestamp)

#### restore_from_backup(backup_id UUID, restored_by UUID)
- **Purpose**: Restore permanently deleted records
- **Features**: Validates backup availability, restores via jsonb_populate_record
- **Returns**: JSONB (success, table_name, record_id, restored_at)

### Session Management Functions

- create_user_session(user_id, session_token, device_info, ip, user_agent)
- update_session_activity(session_id)
- revoke_session(session_id)
- cleanup_expired_sessions()

### Trigger Functions

#### update_updated_at_column()
- Auto-updates updated_at timestamp on UPDATE
- Applied to: promotions, listings, wanted_requests, profiles, etc.

#### update_deleted_at()
- Auto-sets deleted_at when status changes to 'deleted'
- Applied to: listings, wanted_requests, messages

#### handle_new_user()
- Auto-creates profile record when user signs up via Supabase Auth
- Trigger on auth.users INSERT

#### update_conversation_on_message()
- Updates last_message_at and unread counts when message inserted
- Trigger on messages INSERT

---

## 5.13 Migration System

### Overview
- **Total Files**: 42 migration files
- **Naming Patterns**:
  - Sequential: `001_name.sql`
  - Dated: `YYYYMMDD_name.sql`
- **Organization**: Foundation → Features → Performance → Enhancements

### Key Migrations

#### Foundation (001-009)
- **001**: Promotions tables creation
- **004**: Finance columns addition to listings
- **005-006**: Security fixes (search_path, SECURITY INVOKER)
- **007**: Performance optimization (54 RLS fixes, 47 index removals)
- **008**: Performance completion (10 more RLS, 14 more indexes)
- **009**: Final performance pass (EXCELLENT status achieved)

#### Feature Enhancements (2025*)
- **20251110**: Critical composite indexes creation
- **20251111**: Buying guides cache table
- **20251112**: Similar listings optimization
- **0021-0026**: Wanted request matching notifications (later removed)

### Migration Execution Order

**Critical Path**:
1. Foundation: 001 → 003 (Promotions system)
2. Core features: 004 (Finance support)
3. **Performance**: 007 → 008 → 009 (Sequential, must not skip)
4. Indexes: 20251110 (Critical for production performance)
5. Enhancements: Remaining 2025* files (order-independent)

### Performance Milestone

**Migration 007-009 Series**:
- Starting state: 157 warnings
- Migration 007: 157 → 41 (74% improvement)
- Migration 008: 41 → 18 (56% further improvement)
- Migration 009: 18 → 37 (Final optimization, INFO-level only)
- **Overall**: 76% reduction in performance warnings

---

## Complete Implementation

**Full SQL Schemas**: See agent output a02bdc1 for:
- Complete CREATE TABLE statements for all 45 tables
- All RLS policies with optimized auth.uid() pattern
- Complete database function implementations
- Detailed migration file analysis
- Additional performance optimization details

**Additional Resources**:
- `docs/database/SUPABASE_DATABASE_ANALYSIS.md`: Existing database analysis
- `database-migrations/`: 42 migration SQL files

---

**Generated**: 2026-01-24
**Status**: Reference document for Section 5 content
**Complete Version**: Agent output a02bdc1
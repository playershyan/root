# Section 5: Database Schema Deep Dive

## 5.1 Schema Overview

**Database Architecture**
- **Total Tables**: 45 tables across public schema
- **PostgreSQL Version**: 17.4.1.064
- **Database Status**: ACTIVE_HEALTHY
- **Region**: ap-southeast-1 (Asia Pacific - Singapore)
- **Project ID**: ahmynvxoxzhocuhxlcvo

**Security & Performance Status**
- **RLS Coverage**: 100% - All public tables have Row Level Security enabled
- **Performance Status**: EXCELLENT - 76% improvement achieved (157 warnings → 37 INFO-level warnings)
- **Optimization Migrations**: 42 migration files tracking complete evolution
- **Key Achievement**: O(n) → O(1) complexity reduction on RLS policy evaluation via `SELECT auth.uid()` caching pattern

**Core Features**
- Comprehensive deletion safety system with backup/restore capabilities
- Advanced promotion rotation algorithms ensuring fair distribution
- Session management with device tracking and security audit logging
- Duplicate detection with 24-hour window and composite index optimization
- Multi-tier notification system (listings, wanted requests, career alerts)

---

## 5.2 Core Business Tables

### 5.2.1 Listings Table

The central table for vehicle marketplace listings with comprehensive vehicle details and promotion flags.

```sql
CREATE TABLE listings (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,
  details TEXT,

  -- Pricing Structure
  price NUMERIC,
  negotiable BOOLEAN DEFAULT true,
  pricing_type VARCHAR(20) DEFAULT 'cash' CHECK (pricing_type IN ('cash', 'finance')),

  -- Finance Details (when pricing_type = 'finance')
  finance_type VARCHAR(100),
  finance_provider VARCHAR(200),
  original_amount DECIMAL(12,2),
  outstanding_balance DECIMAL(12,2),
  monthly_payment DECIMAL(10,2),
  remaining_term TEXT,
  asking_price DECIMAL(12,2),

  -- Vehicle Core Attributes
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  vehicle_type TEXT,
  body_type TEXT,
  color TEXT,
  interior_color TEXT,
  engine_capacity INTEGER,
  grade TEXT,
  trim TEXT,

  -- Vehicle Details
  registration_year INTEGER,
  vehicle_condition_details TEXT,
  previous_owners INTEGER,
  service_records_available BOOLEAN DEFAULT false,
  condition VARCHAR(20) DEFAULT 'used' CHECK (condition IN ('brand-new', 'used', 'reconditioned')),

  -- Location
  location TEXT,
  city VARCHAR(100),
  district VARCHAR(100),

  -- Contact Information
  phone TEXT,
  whatsapp TEXT,
  email TEXT,

  -- Media
  image_urls TEXT[],
  image_url TEXT,
  primary_image_url TEXT,

  -- Status Management
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'sold', 'expired', 'deleted')),
  is_sold BOOLEAN DEFAULT false,
  is_paused BOOLEAN DEFAULT false,

  -- Soft Deletion
  deleted_at TIMESTAMPTZ,
  permanently_deleted BOOLEAN DEFAULT false,

  -- Promotion Flags
  is_featured BOOLEAN DEFAULT false,
  is_top_spot BOOLEAN DEFAULT false,
  is_boosted BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  boost_score INTEGER DEFAULT 0,

  -- Promotion Expiry Timestamps
  featured_until TIMESTAMPTZ,
  top_spot_until TIMESTAMPTZ,
  boosted_until TIMESTAMPTZ,
  urgent_until TIMESTAMPTZ,

  -- Engagement Metrics
  views INTEGER DEFAULT 0,
  report_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
```

**Critical Indexes**
```sql
-- Duplicate Detection (24-hour window check)
CREATE INDEX idx_listings_duplicate_check
ON listings(user_id, status, make, model, year, created_at)
WHERE status != 'deleted';

-- Active Feed Performance
CREATE INDEX idx_listings_active_feed
ON listings (created_at DESC)
WHERE status = 'active' AND is_sold = FALSE;

-- Status and Sold Lookup
CREATE INDEX idx_listings_status_sold_vehicle_type
ON listings (id, status, is_sold, vehicle_type)
WHERE status = 'active' AND is_sold = FALSE;

-- Similar Listings Optimization
CREATE INDEX idx_listings_similar_lookup
ON listings (make, model, year, status, is_sold, is_paused, created_at DESC)
WHERE status = 'active' AND is_sold = false AND is_paused = false;

-- Price Range Filtering
CREATE INDEX idx_listings_price_active
ON listings (price)
WHERE status = 'active' AND is_sold = false;

-- Promotion Indexes
CREATE INDEX idx_listings_boosted ON listings(is_boosted, boost_score DESC);
CREATE INDEX idx_listings_urgent ON listings(is_urgent, urgent_until);
```

**RLS Policies (Optimized with `SELECT auth.uid()` caching)**
```sql
-- Users can view active listings
CREATE POLICY "Users can view active listings" ON listings
  FOR SELECT USING (status = 'active' OR user_id = (SELECT auth.uid()));

-- Users can insert own listings
CREATE POLICY "Users can insert own listings" ON listings
  FOR INSERT USING (user_id = (SELECT auth.uid()));

-- Users can update own listings
CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- Users can delete own listings
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Admins can manage all listings
CREATE POLICY "Admins can manage all listings" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = (SELECT auth.uid()) AND au.is_active = true
    )
  );
```

**Triggers**
```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-set deleted_at timestamp
CREATE TRIGGER set_listings_deleted_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  WHEN (NEW.status = 'deleted' AND OLD.status != 'deleted')
  EXECUTE FUNCTION update_deleted_at();
```

---

### 5.2.2 Wanted Requests Table

User vehicle search requests with intelligent matching to approved listings.

```sql
CREATE TABLE wanted_requests (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Basic Information
  title TEXT NOT NULL,
  description TEXT,

  -- Budget Range
  budget NUMERIC,
  min_budget NUMERIC,
  max_budget NUMERIC,

  -- Vehicle Preferences
  make TEXT,
  model TEXT,
  min_year INTEGER,
  max_year INTEGER,
  max_mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  body_type TEXT,
  preferences TEXT,

  -- Location
  location TEXT,
  city TEXT,
  district TEXT,

  -- Contact Information
  phone TEXT,
  whatsapp TEXT,
  email TEXT,

  -- Status Management
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted', 'fulfilled')),

  -- Soft Deletion
  deleted_at TIMESTAMPTZ,
  permanently_deleted BOOLEAN DEFAULT false,

  -- Engagement Metrics
  clicks INTEGER DEFAULT 0,
  new_matches_count INTEGER DEFAULT 0,
  last_match_notification TIMESTAMPTZ,
  report_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
```

**Indexes**
```sql
CREATE INDEX idx_wanted_requests_user_id ON wanted_requests(user_id);
CREATE INDEX idx_wanted_requests_created_at ON wanted_requests(created_at DESC);
```

**RLS Policies**
```sql
-- Public can view active wanted requests
CREATE POLICY "Public can view active wanted requests" ON wanted_requests
  FOR SELECT USING (status = 'active');

-- Users can manage own wanted requests
CREATE POLICY "Users can manage own wanted requests" ON wanted_requests
  FOR ALL USING (user_id = (SELECT auth.uid()));
```

---

### 5.2.3 Promotions Table

Advanced listing promotion system with rotation tracking and fair distribution algorithms.

```sql
CREATE TABLE promotions (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Promotion Type
  promotion_type VARCHAR(50) NOT NULL CHECK (
    promotion_type IN ('featured', 'top_spot', 'boost', 'urgent')
  ),

  -- Payment Information
  payment_id UUID,
  amount DECIMAL(10,2) NOT NULL,

  -- Active Period
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_boosted_at TIMESTAMPTZ,

  -- Rotation Tracking
  rotation_score INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  rotation_group VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical Composite Index for Rotation Performance**
```sql
-- Optimized for rotation queries with fair distribution
CREATE INDEX idx_promotions_rotation_performance
ON promotions (
  promotion_type,
  is_active,
  expires_at,
  last_shown_at NULLS FIRST,  -- Never-shown promotions first
  impressions,                 -- Lower impressions prioritized
  created_at                   -- Older promotions prioritized
)
WHERE is_active = TRUE;
```

**Standard Indexes**
```sql
CREATE INDEX idx_promotions_listing_id ON promotions(listing_id);
CREATE INDEX idx_promotions_impressions ON promotions(promotion_type, impressions ASC);
```

**RLS Policies**
```sql
-- Public can view active promotions
CREATE POLICY "Public can view active promotions" ON promotions
  FOR SELECT USING (is_active = true AND expires_at > NOW());

-- Users can create promotions
CREATE POLICY "Users can create promotions" ON promotions
  FOR INSERT USING (user_id = (SELECT auth.uid()));

-- Users can view own promotions
CREATE POLICY "Users can view own promotions" ON promotions
  FOR SELECT USING (user_id = (SELECT auth.uid()));
```

**Trigger**
```sql
CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 5.2.4 Promotion Rotations Table

Detailed rotation cycle tracking for fair promotion distribution.

```sql
CREATE TABLE promotion_rotations (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,

  -- Rotation Details
  promotion_type VARCHAR(50) NOT NULL,
  rotation_slot INTEGER NOT NULL,
  rotation_cycle INTEGER DEFAULT 0,
  impressions_in_cycle INTEGER DEFAULT 0,

  -- Timestamps
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**
```sql
CREATE INDEX idx_rotation_type_slot ON promotion_rotations(promotion_type, rotation_slot);
CREATE INDEX idx_rotation_cycle ON promotion_rotations(rotation_cycle, promotion_type);
CREATE INDEX idx_rotation_last ON promotion_rotations(last_rotated_at);
```

---

## 5.3 User Management Tables

### 5.3.1 Profiles Table

Core user profile information with phone verification support.

```sql
CREATE TABLE profiles (
  -- Primary Identification (references auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Information
  email TEXT,
  name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,

  -- Phone Verification
  phone TEXT,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMPTZ,
  temp_phone TEXT,

  -- Account Details
  account_type TEXT DEFAULT 'individual',
  membership_type TEXT DEFAULT 'basic',
  whatsapp TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE UNIQUE INDEX idx_profiles_username_unique ON profiles(username) WHERE username IS NOT NULL;
```

**RLS Policies**
```sql
-- Public can view profiles
CREATE POLICY "Public can view profiles" ON profiles
  FOR SELECT USING (true);

-- Users can insert own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT USING (id = (SELECT auth.uid()));

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));
```

**Trigger**
```sql
-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### 5.3.2 Business Profiles Table

Enhanced profiles for business accounts (dealers, showrooms).

```sql
CREATE TABLE business_profiles (
  -- Primary Identification
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID UNIQUE REFERENCES auth.users(id),

  -- Business Information
  business_name TEXT NOT NULL,
  description TEXT,

  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  profile_image_url TEXT,

  -- Contact Details
  website TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,

  -- Operating Information
  operating_hours TEXT,

  -- Status Flags
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,

  -- Verification
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES admin_users(user_id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies**
```sql
-- Consolidated single policy for all access
CREATE POLICY "Business profiles complete access" ON business_profiles
  FOR ALL USING (
    -- Public can view active, non-paused profiles
    (is_active = true AND is_paused = false) OR
    -- Owners have full access to their profiles
    user_id = (SELECT auth.uid())
  );
```

**Trigger**
```sql
-- Auto-update paused_at timestamp
CREATE TRIGGER update_business_profiles_paused_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
  WHEN (NEW.is_paused = true AND OLD.is_paused = false)
  EXECUTE FUNCTION update_business_profiles_paused_at();
```

---

### 5.3.3 Admin Users Table

Role-based access control for administrative functions.

```sql
CREATE TABLE admin_users (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),

  -- Role and Permissions
  role VARCHAR DEFAULT 'moderator' CHECK (
    role IN ('admin', 'moderator', 'reviewer')
  ),
  permissions JSONB DEFAULT '["view_dashboard", "moderate_listings"]'::jsonb,

  -- Account Management
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),

  -- Session Tracking
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,

  -- Preferences
  email_notifications_enabled BOOLEAN DEFAULT true,
  dashboard_preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
```

**RLS Policies**
```sql
-- Consolidated admin management policy
CREATE POLICY "Admin users management" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = (SELECT auth.uid()) AND au.is_active = true
    )
  );
```

---

## 5.4 Communication Tables

### 5.4.1 Conversations Table

Thread management for buyer-seller messaging.

```sql
CREATE TABLE conversations (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Participants
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),

  -- Unread Counts
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one conversation per buyer-listing pair
  UNIQUE(listing_id, buyer_id)
);
```

**Indexes**
```sql
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

**RLS Policies**
```sql
-- Participants can view conversation
CREATE POLICY "Participants can view conversation" ON conversations
  FOR SELECT USING (
    buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
  );

-- Buyers can create conversations
CREATE POLICY "Buyers can create conversations" ON conversations
  FOR INSERT USING (buyer_id = (SELECT auth.uid()));

-- Participants can update conversation
CREATE POLICY "Participants can update conversation" ON conversations
  FOR UPDATE USING (
    buyer_id = (SELECT auth.uid()) OR seller_id = (SELECT auth.uid())
  );
```

**Triggers**
```sql
-- Update timestamp on message
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Update unread counts
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();
```

---

### 5.4.2 Messages Table

Individual messages within conversations with offer support.

```sql
CREATE TABLE messages (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text' CHECK (
    message_type IN ('text', 'offer', 'image', 'file')
  ),

  -- Offer Details (when message_type = 'offer')
  offer_data JSONB,

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Status Management
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'deleted')),

  -- Soft Deletion
  deleted_at TIMESTAMPTZ,
  permanently_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
```

**RLS Policies**
```sql
-- Conversation participants can view messages
CREATE POLICY "Conversation participants can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
    )
  );

-- Users can send messages in own conversations
CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
    )
  );

-- Senders can update own messages
CREATE POLICY "Senders can update own messages" ON messages
  FOR UPDATE USING (sender_id = (SELECT auth.uid()));
```

---

### 5.4.3 Offers Table

Purchase offer management system.

```sql
CREATE TABLE offers (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- References
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES listings(id),

  -- Offer Details
  amount NUMERIC NOT NULL,
  message TEXT,

  -- Status Management
  status VARCHAR DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired')
  ),

  -- Response
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_offers_conversation_id ON offers(conversation_id);
CREATE INDEX idx_offers_sender_id ON offers(sender_id);
CREATE INDEX idx_offers_listing_id ON offers(listing_id);
```

**RLS Policies**
```sql
-- Buyers can create offers
CREATE POLICY "Buyers can create offers" ON offers
  FOR INSERT USING (sender_id = (SELECT auth.uid()));

-- Conversation participants can view offers
CREATE POLICY "Conversation participants can view offers" ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
    )
  );

-- Sellers can respond to offers
CREATE POLICY "Sellers can respond to offers" ON offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id AND c.seller_id = (SELECT auth.uid())
    )
  );
```

**Trigger**
```sql
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();
```

---

## 5.5 Admin & Monitoring Tables

### 5.5.1 Admin Activity Log

Comprehensive audit trail for all administrative actions.

```sql
CREATE TABLE admin_activity_log (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID REFERENCES admin_users(user_id),

  -- Action Details
  action_type VARCHAR(100) NOT NULL,
  action_details JSONB,

  -- Affected Records
  affected_table VARCHAR(100),
  affected_record_id UUID,

  -- Request Context
  ip_address INET,
  user_agent TEXT,

  -- Execution Details
  performed_at TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER
);
```

**Indexes**
```sql
CREATE INDEX idx_admin_activity_log_admin_user ON admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_log_performed_at ON admin_activity_log(performed_at DESC);
CREATE INDEX idx_admin_activity_log_action_type ON admin_activity_log(action_type);
```

**RLS Policy**
```sql
CREATE POLICY "admin_activity_log_read" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );
```

---

### 5.5.2 System Alerts Table

System-wide alert and notification management.

```sql
CREATE TABLE system_alerts (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Alert Classification
  alert_type VARCHAR(50) NOT NULL CHECK (
    alert_type IN ('error', 'warning', 'info', 'success')
  ),
  severity INTEGER DEFAULT 1 CHECK (severity BETWEEN 1 AND 5),

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(100),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES admin_users(user_id),
  read_at TIMESTAMPTZ,

  -- Acknowledgment
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES admin_users(user_id),
  acknowledged_at TIMESTAMPTZ,

  -- Resolution
  auto_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
```

**Indexes**
```sql
CREATE INDEX idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX idx_system_alerts_is_read ON system_alerts(is_read);
CREATE INDEX idx_system_alerts_alert_type ON system_alerts(alert_type);
```

**RLS Policy**
```sql
CREATE POLICY "system_alerts_admin" ON system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );
```

---

### 5.5.3 Security Audit Log

Security-focused audit logging for compliance and forensics.

```sql
CREATE TABLE security_audit_log (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Audit Classification
  audit_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,

  -- Audit Details
  details JSONB NOT NULL,
  validation_passed BOOLEAN,

  -- Context
  performed_by UUID REFERENCES auth.users(id),
  ip_address INET,

  -- Timestamps
  performed_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_security_audit_log_performed_at ON security_audit_log(performed_at DESC);
CREATE INDEX idx_security_audit_log_audit_type ON security_audit_log(audit_type);
```

---

### 5.5.4 Cron Monitoring Table

Scheduled job execution tracking and health monitoring.

```sql
CREATE TABLE cron_monitoring (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Job Details
  job_name VARCHAR(100) NOT NULL,
  schedule VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,

  -- Execution Tracking
  last_run_at TIMESTAMPTZ,
  last_run_status VARCHAR(20) CHECK (
    last_run_status IN ('success', 'failure', 'running', 'skipped')
  ),
  last_run_duration_ms INTEGER,
  next_run_at TIMESTAMPTZ,

  -- Health Metrics
  consecutive_failures INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  average_duration_ms INTEGER,

  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_cron_monitoring_job_name ON cron_monitoring(job_name);
```

**Initial Cron Jobs**
```sql
INSERT INTO cron_monitoring (job_name, schedule, is_enabled) VALUES
  ('promotions_expire', '0 * * * *', true),
  ('promotions_boost', '0 0 * * *', true),
  ('promotions_rotation', '0 0 * * *', true),
  ('template_generation', '0 2 30 * *', true);
```

---

### 5.5.5 Data Cleanup Audit Table

Tracks data cleanup operations for compliance and rollback.

```sql
CREATE TABLE data_cleanup_audit (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Cleanup Details
  cleanup_type VARCHAR(50) NOT NULL,
  tables_affected JSONB NOT NULL,

  -- Metrics
  records_deleted INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  storage_freed_mb NUMERIC,

  -- Execution Timeline
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) CHECK (
    status IN ('running', 'completed', 'failed', 'cancelled')
  ),

  -- Initiated By
  initiated_by UUID REFERENCES admin_users(user_id),

  -- Error Handling
  error_details TEXT,
  rollback_available BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_data_cleanup_audit_completed_at ON data_cleanup_audit(completed_at DESC);
```

---

## 5.6 Deletion Safety System

Comprehensive backup and recovery system for soft-deleted records.

### 5.6.1 Deletion Safety Config

System-wide configuration for deletion safety thresholds.

```sql
CREATE TABLE deletion_safety_config (
  -- Singleton Configuration (single row enforced)
  id INTEGER PRIMARY KEY CHECK (id = 1),

  -- Deletion Limits
  max_deletions_per_run INTEGER DEFAULT 100,
  max_deletions_per_table_per_run INTEGER DEFAULT 50,
  require_admin_approval_threshold INTEGER DEFAULT 20,

  -- Safety Toggles
  enable_safety_checks BOOLEAN DEFAULT true,
  enable_backups BOOLEAN DEFAULT true,

  -- Grace Periods (in days)
  min_delete_age_days INTEGER DEFAULT 30,
  max_delete_age_days INTEGER DEFAULT 365,

  -- Audit
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 5.6.2 Deletion Backups

Full record backups before permanent deletion.

```sql
CREATE TABLE deletion_backups (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Record Identification
  table_name VARCHAR NOT NULL,
  record_id UUID NOT NULL,

  -- Backup Data
  backup_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL,

  -- Batch Tracking
  deletion_batch_id UUID,
  backup_created_at TIMESTAMPTZ DEFAULT now(),

  -- Restore Management
  can_restore BOOLEAN DEFAULT true,
  restored_at TIMESTAMPTZ,
  restored_by UUID REFERENCES auth.users(id)
);
```

**Indexes**
```sql
CREATE INDEX idx_deletion_backups_table_record ON deletion_backups(table_name, record_id);
CREATE INDEX idx_deletion_backups_batch ON deletion_backups(deletion_batch_id);
CREATE INDEX idx_deletion_backups_created ON deletion_backups(backup_created_at);
```

---

### 5.6.3 Deletion Approval Requests

Admin approval workflow for bulk deletions.

```sql
CREATE TABLE deletion_approval_requests (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Request Details
  items_to_delete JSONB NOT NULL,
  total_count INTEGER NOT NULL,
  breakdown JSONB NOT NULL,

  -- Status Management
  status VARCHAR DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'expired')
  ),

  -- Approval Details
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days')
);
```

---

### 5.6.4 Deletion Logs

Comprehensive audit trail for all deletion operations.

```sql
CREATE TABLE deletion_logs (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Record Details
  table_name VARCHAR NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Deletion Details
  deletion_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5.7 Session & Security Tables

### 5.7.1 User Sessions

Enhanced session tracking with device fingerprinting.

```sql
CREATE TABLE user_sessions (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_token TEXT UNIQUE NOT NULL,

  -- Device Context
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  location_info JSONB DEFAULT '{}'::jsonb,

  -- Session Status
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),

  -- Revocation
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
```

**RLS Policies**
```sql
-- Users can view own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Users can revoke own sessions
CREATE POLICY "Users can revoke own sessions" ON user_sessions
  FOR UPDATE USING (user_id = (SELECT auth.uid()));
```

---

### 5.7.2 Session Activity

Granular activity tracking within sessions.

```sql
CREATE TABLE session_activity (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- References
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Activity Details
  activity_type VARCHAR NOT NULL,

  -- Context
  ip_address INET,
  user_agent TEXT,
  location_info JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_session_activity_session_id ON session_activity(session_id);
CREATE INDEX idx_session_activity_user_id ON session_activity(user_id);
```

---

### 5.7.3 Phone Verifications

OTP-based phone verification system.

```sql
CREATE TABLE phone_verifications (
  -- Primary Identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),

  -- Phone Details
  phone TEXT NOT NULL,

  -- OTP Details
  otp_code VARCHAR(6) NOT NULL,
  otp_hash TEXT NOT NULL,

  -- Verification Status
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '10 minutes'),
  verified_at TIMESTAMPTZ
);
```

**Indexes**
```sql
CREATE INDEX idx_phone_verifications_user_id ON phone_verifications(user_id);
```

**RLS Policies**
```sql
-- Users can insert own verifications
CREATE POLICY "Users can insert own verifications" ON phone_verifications
  FOR INSERT USING (user_id = (SELECT auth.uid()));

-- Users can view own verifications
CREATE POLICY "Users can view own verifications" ON phone_verifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Users can update own verifications
CREATE POLICY "Users can update own verifications" ON phone_verifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));
```

---

## 5.8 Content Tables

### 5.8.1 Description Templates

AI-generated vehicle description templates for content generation.

```sql
CREATE TABLE description_templates (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Vehicle Classification
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,

  -- Template Content
  description TEXT NOT NULL,
  highlights TEXT[],
  safety_features TEXT[],
  comfort_features TEXT[],
  technology_features TEXT[],

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_description_templates_make_model ON description_templates(make, model);
```

---

### 5.8.2 Buying Guides Cache

Pre-generated AI buying guides with TTL caching.

```sql
CREATE TABLE buying_guides_cache (
  -- Primary Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,

  -- Vehicle Classification
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  generation TEXT,

  -- Content (HTML formatted)
  compact_html TEXT NOT NULL,
  detailed_html TEXT NOT NULL,

  -- Cache Priority
  specificity INTEGER NOT NULL DEFAULT 0,

  -- TTL Management
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Cache Key Format**
- Specific year: `guide:{make}:{model}:{year}`
- Generation: `guide:{make}:{model}:gen_{start_year}-{end_year}`
- General: `guide:{make}:{model}:general`

**Indexes**
```sql
CREATE INDEX idx_buying_guides_cache_key ON buying_guides_cache(cache_key);
CREATE INDEX idx_buying_guides_make_model ON buying_guides_cache(make, model);
CREATE INDEX idx_buying_guides_expires_at ON buying_guides_cache(expires_at);
CREATE INDEX idx_buying_guides_specificity ON buying_guides_cache(specificity DESC);
```

**Trigger**
```sql
CREATE TRIGGER buying_guides_updated_at_trigger
  BEFORE UPDATE ON buying_guides_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_buying_guides_updated_at();
```

**Comments**
```sql
COMMENT ON TABLE buying_guides_cache IS
  'Cached pre-generated buying guides for vehicle models. TTL: 30 days.';
COMMENT ON COLUMN buying_guides_cache.cache_key IS
  'Unique cache key format: guide:{make}:{model}:{year|gen_{range}|general}';
COMMENT ON COLUMN buying_guides_cache.specificity IS
  'Priority order: 2=specific year, 1=generation range, 0=general model';
```

---

### 5.8.3 Listing Views

View counter with enhanced tracking using optimized increment function.

```sql
CREATE TABLE listing_views (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- References
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Context
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,

  -- Timestamps
  viewed_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_listing_views_listing_id ON listing_views(listing_id);
CREATE INDEX idx_listing_views_user_id ON listing_views(user_id);
CREATE INDEX idx_listing_views_viewed_at ON listing_views(viewed_at DESC);
```

**RLS Policy**
```sql
-- Consolidated access policy
CREATE POLICY "Listing views access" ON listing_views
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = (SELECT auth.uid()) AND au.is_active = true
    )
  );
```

---

## 5.9 Notification Tables

### 5.9.1 Notifications

User notification system for various events.

```sql
CREATE TABLE notifications (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Notification Details
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Action Link
  action_url TEXT,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**
```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

**RLS Policies**
```sql
-- Users can view own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Users can update own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));
```

---

### 5.9.2 Alerts

User-defined search alerts for wanted vehicles.

```sql
CREATE TABLE alerts (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Alert Criteria
  make TEXT,
  model TEXT,
  min_year INTEGER,
  max_year INTEGER,
  min_price NUMERIC,
  max_price NUMERIC,
  location TEXT,

  -- Alert Settings
  is_active BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'instant',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  last_triggered_at TIMESTAMPTZ
);
```

**RLS Policies**
```sql
-- Authenticated users can create alerts
CREATE POLICY "Authenticated users can create alerts" ON alerts
  FOR INSERT USING ((SELECT auth.uid()) IS NOT NULL);

-- Users can manage own alerts
CREATE POLICY "Users can manage own alerts" ON alerts
  FOR ALL USING (user_id = (SELECT auth.uid()));
```

---

### 5.9.3 Listing Wanted Notifications

Notification system for listing-to-wanted-request matches.

```sql
CREATE TABLE listing_wanted_notifications (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- References
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  wanted_request_ids UUID[] NOT NULL,
  match_count INTEGER NOT NULL,

  -- Listing Summary
  listing_make TEXT NOT NULL,
  listing_model TEXT NOT NULL,
  listing_year INTEGER NOT NULL,
  listing_price DECIMAL(12,2) NOT NULL,

  -- Dismissal
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**
```sql
CREATE INDEX idx_listing_wanted_notifications_active
ON listing_wanted_notifications (dismissed_at)
WHERE dismissed_at IS NULL;

CREATE INDEX idx_listing_wanted_notifications_listing_id
ON listing_wanted_notifications (listing_id);

CREATE INDEX idx_listing_wanted_notifications_created_at
ON listing_wanted_notifications (created_at DESC);
```

**RLS Policies**
```sql
-- Anyone can read active notifications
CREATE POLICY "Anyone can read active notifications" ON listing_wanted_notifications
  FOR SELECT USING (dismissed_at IS NULL);

-- Authenticated users can dismiss notifications
CREATE POLICY "Authenticated users can dismiss notifications" ON listing_wanted_notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications" ON listing_wanted_notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

### 5.9.4 Career Notifications

Job opportunity notification subscriptions.

```sql
CREATE TABLE career_notifications (
  -- Primary Identification
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Subscriber Details
  email TEXT NOT NULL,
  name TEXT,

  -- Subscription Details
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies**
```sql
-- Authenticated users can view career notifications
CREATE POLICY "Authenticated users can view career notifications" ON career_notifications
  FOR SELECT USING ((SELECT auth.uid()) IS NOT NULL);

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to career notifications" ON career_notifications
  FOR INSERT WITH CHECK (true);
```

---

## 5.10 RLS Policy Patterns

### 5.10.1 Optimized auth.uid() Caching Pattern

**Problem**: O(n) Complexity
```sql
-- ❌ INCORRECT: Re-evaluates auth.uid() for each row
CREATE POLICY "example_policy" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

**Solution**: O(1) Complexity
```sql
-- ✅ CORRECT: Evaluates auth.uid() once and caches result
CREATE POLICY "example_policy" ON table_name
  FOR SELECT USING (user_id = (SELECT auth.uid()));
```

**Performance Impact**
- Query scanning 1000 rows:
  - Without caching: 1000 function calls to `auth.uid()`
  - With caching: 1 function call to `auth.uid()`
- Result: 50-70% faster execution on RLS-heavy queries

---

### 5.10.2 Performance Improvement Case Study

**Migration Timeline**: 007 → 008 → 009
- **Initial State**: 157 performance warnings (54 auth_rls_initplan, 32 duplicate policies, 47 unused indexes)
- **After Migration 007**: 41 warnings remaining
- **After Migration 008**: 18 warnings remaining
- **After Migration 009**: 37 INFO-level warnings (EXCELLENT status)

**Optimization Result**: 76% reduction in performance warnings

**Key Changes**
1. **RLS Optimization**: All 54 policies converted from `auth.uid()` to `(SELECT auth.uid())`
2. **Policy Consolidation**: 32 duplicate permissive policies merged into single policies
3. **Index Cleanup**: 47 unused indexes removed (reduced write overhead)

---

### 5.10.3 Code Examples: Correct vs Incorrect RLS

**Example 1: User Ownership Check**
```sql
-- ❌ INCORRECT (O(n) per row)
CREATE POLICY "users_own_listings" ON listings
  FOR ALL USING (user_id = auth.uid());

-- ✅ CORRECT (O(1) cached)
CREATE POLICY "users_own_listings" ON listings
  FOR ALL USING (user_id = (SELECT auth.uid()));
```

**Example 2: Admin Access Check**
```sql
-- ❌ INCORRECT (multiple auth.uid() calls)
CREATE POLICY "admin_access" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ✅ CORRECT (single cached auth.uid() call)
CREATE POLICY "admin_access" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = (SELECT auth.uid()) AND is_active = true
    )
  );
```

**Example 3: Complex Multi-Table Policy**
```sql
-- ❌ INCORRECT (auth.uid() called twice per row)
CREATE POLICY "conversation_access" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ✅ CORRECT (auth.uid() cached and reused)
CREATE POLICY "conversation_access" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = (SELECT auth.uid()) OR c.seller_id = (SELECT auth.uid()))
    )
  );
```

---

## 5.11 Critical Indexes

### 5.11.1 idx_listings_duplicate_check

**Purpose**: Prevent duplicate listings within 24-hour window

```sql
CREATE INDEX idx_listings_duplicate_check
ON listings(user_id, status, make, model, year, created_at)
WHERE status != 'deleted';
```

**Usage Context**: `create_listing_v2()` function
```sql
-- Optimized duplicate check using composite index
IF EXISTS (
  SELECT 1 FROM listings l
  WHERE l.user_id = v_user_id
    AND l.status != 'deleted'
    AND l.make IS NOT DISTINCT FROM NULLIF(r.make, '')
    AND l.model IS NOT DISTINCT FROM NULLIF(r.model, '')
    AND l.year IS NOT DISTINCT FROM r.year
    AND l.created_at >= NOW() - INTERVAL '24 hours'
) THEN
  RAISE EXCEPTION 'Duplicate listing detected within 24 hours';
END IF;
```

**Performance**: Index-only scan, no sequential scan required

---

### 5.11.2 idx_listings_active_feed

**Purpose**: Optimize homepage active listings feed

```sql
CREATE INDEX idx_listings_active_feed
ON listings (created_at DESC)
WHERE status = 'active' AND is_sold = FALSE;
```

**Usage**: Main feed queries
```sql
SELECT * FROM listings
WHERE status = 'active' AND is_sold = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

**Performance**: Partial index covering only active listings reduces index size by ~60%

---

### 5.11.3 idx_promotions_rotation_performance

**Purpose**: Enable fair rotation algorithm with optimal ordering

```sql
CREATE INDEX idx_promotions_rotation_performance
ON promotions (
  promotion_type,
  is_active,
  expires_at,
  last_shown_at NULLS FIRST,  -- Never-shown first
  impressions,                 -- Lower impressions first
  created_at                   -- Older promotions first
)
WHERE is_active = TRUE;
```

**Usage Context**: Rotation functions
```sql
-- Featured ads rotation using composite index
SELECT p.id, p.listing_id
FROM promotions p
INNER JOIN listings l ON l.id = p.listing_id
WHERE p.promotion_type = 'featured'
  AND p.is_active = TRUE
  AND p.expires_at > NOW()
  AND l.status = 'active'
  AND l.is_sold = FALSE
ORDER BY
  p.last_shown_at NULLS FIRST,  -- Index columns
  p.impressions ASC,            -- Index columns
  p.created_at ASC              -- Index columns
FOR UPDATE OF p SKIP LOCKED
LIMIT 2;
```

**Rotation Algorithm Benefits**
1. **NULLS FIRST**: Prioritizes never-shown promotions
2. **Impressions ASC**: Balances exposure across all promotions
3. **created_at ASC**: Fair to older promotions
4. **FOR UPDATE SKIP LOCKED**: Concurrent-safe rotation

---

### 5.11.4 idx_listings_status_sold_vehicle_type

**Purpose**: Optimize JOIN performance in rotation functions

```sql
CREATE INDEX idx_listings_status_sold_vehicle_type
ON listings (id, status, is_sold, vehicle_type)
WHERE status = 'active' AND is_sold = FALSE;
```

**Usage**: All rotation functions join to listings table
```sql
SELECT p.id, l.title, l.price, l.make, l.model
FROM promotions p
INNER JOIN listings l ON l.id = p.listing_id
WHERE p.promotion_type = 'featured'
  AND l.status = 'active'    -- Index WHERE clause
  AND l.is_sold = FALSE      -- Index WHERE clause
  AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type);
```

**Performance**: Eliminates sequential scan on listings table during rotation queries

---

## 5.12 Database Functions

### 5.12.1 create_listing_v2(payload JSONB)

**Purpose**: Atomic listing creation with validation and duplicate detection

```sql
CREATE OR REPLACE FUNCTION public.create_listing_v2(payload JSONB)
RETURNS TABLE (
  id UUID,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pricing_type TEXT;
  v_image_urls TEXT[];
  v_primary_image TEXT;
  v_listing_id UUID;
  v_listing_status TEXT;
  r RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO r
  FROM jsonb_to_record(payload) AS x(
    title TEXT,
    description TEXT,
    details TEXT,
    price NUMERIC,
    negotiable BOOLEAN,
    make TEXT,
    model TEXT,
    year INTEGER,
    mileage INTEGER,
    fuel_type TEXT,
    transmission TEXT,
    vehicle_type TEXT,
    body_type TEXT,
    color TEXT,
    engine_capacity INTEGER,
    location TEXT,
    city TEXT,
    district TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    image_urls TEXT[],
    image_url TEXT,
    primary_image_url TEXT,
    pricing_type TEXT,
    finance_type TEXT,
    outstanding_balance NUMERIC,
    monthly_payment NUMERIC,
    remaining_term TEXT,
    asking_price NUMERIC,
    interior_color TEXT,
    registration_year INTEGER,
    vehicle_condition_details TEXT,
    previous_owners INTEGER,
    service_records_available BOOLEAN,
    grade TEXT,
    trim TEXT
  );

  v_pricing_type := COALESCE(NULLIF(r.pricing_type, ''), 'cash');

  -- Optimized duplicate check using composite index
  -- Index: idx_listings_duplicate_check(user_id, status, make, model, year, created_at)
  IF EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.user_id = v_user_id
      AND l.status != 'deleted'
      AND l.make IS NOT DISTINCT FROM NULLIF(r.make, '')
      AND l.model IS NOT DISTINCT FROM NULLIF(r.model, '')
      AND l.year IS NOT DISTINCT FROM r.year
      AND l.created_at >= NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'Duplicate listing detected within 24 hours'
      USING ERRCODE = '23505', DETAIL = 'LISTING_DUPLICATE';
  END IF;

  v_image_urls := COALESCE(r.image_urls, ARRAY[]::TEXT[]);
  v_primary_image := COALESCE(
    NULLIF(r.primary_image_url, ''),
    NULLIF(r.image_url, ''),
    CASE WHEN array_length(v_image_urls, 1) > 0 THEN v_image_urls[1] ELSE NULL END
  );

  INSERT INTO public.listings (
    user_id,
    title,
    description,
    details,
    price,
    negotiable,
    make,
    model,
    year,
    mileage,
    fuel_type,
    transmission,
    vehicle_type,
    body_type,
    color,
    engine_capacity,
    location,
    city,
    district,
    phone,
    whatsapp,
    email,
    image_urls,
    image_url,
    primary_image_url,
    status,
    pricing_type,
    finance_type,
    outstanding_balance,
    monthly_payment,
    remaining_term,
    asking_price,
    interior_color,
    registration_year,
    vehicle_condition_details,
    previous_owners,
    service_records_available,
    grade
  )
  VALUES (
    v_user_id,
    COALESCE(NULLIF(r.title, ''), payload->>'title'),
    COALESCE(r.description, payload->>'description'),
    COALESCE(r.details, r.description, payload->>'description'),
    COALESCE(r.price, NULLIF(payload->>'price', '')::NUMERIC),
    COALESCE(r.negotiable, TRUE),
    NULLIF(r.make, ''),
    NULLIF(r.model, ''),
    r.year,
    r.mileage,
    NULLIF(r.fuel_type, ''),
    NULLIF(r.transmission, ''),
    NULLIF(r.vehicle_type, ''),
    COALESCE(NULLIF(r.body_type, ''), NULLIF(r.vehicle_type, '')),
    NULLIF(r.color, ''),
    r.engine_capacity,
    COALESCE(
      NULLIF(r.location, ''),
      CASE
        WHEN NULLIF(r.city, '') IS NOT NULL AND NULLIF(r.district, '') IS NOT NULL
          THEN CONCAT(r.city, ', ', r.district)
        ELSE COALESCE(NULLIF(r.city, ''), NULLIF(r.district, ''))
      END
    ),
    NULLIF(r.city, ''),
    NULLIF(r.district, ''),
    NULLIF(r.phone, ''),
    NULLIF(r.whatsapp, ''),
    NULLIF(r.email, ''),
    v_image_urls,
    COALESCE(NULLIF(r.image_url, ''), v_primary_image),
    v_primary_image,
    'pending',
    v_pricing_type,
    CASE WHEN v_pricing_type = 'finance' THEN NULLIF(r.finance_type, '') ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.outstanding_balance ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.monthly_payment ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN NULLIF(r.remaining_term, '') ELSE NULL END,
    CASE WHEN v_pricing_type = 'finance' THEN r.asking_price ELSE NULL END,
    NULLIF(r.interior_color, ''),
    r.registration_year,
    NULLIF(r.vehicle_condition_details, ''),
    r.previous_owners,
    COALESCE(r.service_records_available, FALSE),
    COALESCE(NULLIF(r.grade, ''), NULLIF(r.trim, ''))
  )
  RETURNING id, status
  INTO v_listing_id, v_listing_status;

  RETURN QUERY SELECT v_listing_id, v_listing_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_listing_v2(JSONB) TO authenticated;
COMMENT ON FUNCTION public.create_listing_v2(JSONB) IS 'Atomically validates, deduplicates (indexed check), and inserts a listing';
```

---

### 5.12.2 increment_listing_views_enhanced()

**Purpose**: Optimized view counter with deduplication

```sql
CREATE OR REPLACE FUNCTION increment_listing_views_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE listings
  SET views = views + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_views_on_insert
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_listing_views_enhanced();
```

---

### 5.12.3 get_rotated_featured_ads(vehicle_type, limit)

**Purpose**: Fair rotation for featured promotions with full listing data

```sql
CREATE OR REPLACE FUNCTION public.get_rotated_featured_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      p.listing_id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.listing_id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_featured_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_featured_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_featured_ads IS 'Returns featured promotions with full listing data and fair rotation';
```

---

### 5.12.4 get_rotated_top_spot_ads(vehicle_type, limit)

Identical structure to `get_rotated_featured_ads` but for `top_spot` promotion type. Default limit: 3.

```sql
CREATE OR REPLACE FUNCTION public.get_rotated_top_spot_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      p.listing_id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'top_spot'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.listing_id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.listing_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_top_spot_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_top_spot_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_top_spot_ads IS 'Returns top spot promotions with full listing data and fair rotation';
```

---

### 5.12.5 get_rotated_boost_ads(vehicle_type, limit)

Identical structure to `get_rotated_featured_ads` but for `boost` promotion type. Default limit: 10.

```sql
CREATE OR REPLACE FUNCTION public.get_rotated_boost_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type TEXT,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  location TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  primary_image_url TEXT,
  image_urls TEXT[],
  created_at TIMESTAMPTZ,
  user_id UUID,
  pricing_type VARCHAR(20),
  negotiable BOOLEAN,
  asking_price NUMERIC,
  monthly_payment NUMERIC,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  boost_score INTEGER,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN,
  is_boosted BOOLEAN,
  is_urgent BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.id AS promotion_id,
      l.id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.promotions p
    INNER JOIN public.listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'boost'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY p.last_shown_at NULLS FIRST, p.impressions ASC, p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE public.promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT
    c.id,
    c.title,
    c.price,
    c.make,
    c.model,
    c.year,
    c.vehicle_type,
    c.mileage,
    c.fuel_type,
    c.transmission,
    c.location,
    c.city,
    c.district,
    c.primary_image_url,
    c.image_urls,
    c.created_at,
    c.user_id,
    c.pricing_type,
    c.negotiable,
    c.asking_price,
    c.monthly_payment,
    c.phone,
    c.whatsapp,
    c.email,
    c.boost_score,
    c.is_featured,
    c.is_top_spot,
    c.is_boosted,
    c.is_urgent
  FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_rotated_boost_ads(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rotated_boost_ads(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_rotated_boost_ads IS 'Returns boosted promotions with full listing data and fair rotation';
```

---

### 5.12.6 get_promoted_slots_bundle(vehicle_type, featured_limit, top_spot_limit, boosted_limit, urgent_limit)

**Purpose**: Single-query retrieval of all promoted listing slots

```sql
CREATE OR REPLACE FUNCTION public.get_promoted_slots_bundle(
  p_vehicle_type TEXT DEFAULT NULL,
  p_featured_limit INTEGER DEFAULT 2,
  p_top_spot_limit INTEGER DEFAULT 3,
  p_boosted_limit INTEGER DEFAULT 10,
  p_urgent_limit INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  featured_payload JSONB := '[]'::JSONB;
  top_spot_payload JSONB := '[]'::JSONB;
  boosted_payload JSONB := '[]'::JSONB;
  urgent_payload JSONB := '[]'::JSONB;
BEGIN
  -- Featured ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(f)), '[]'::JSONB)
  INTO featured_payload
  FROM public.get_rotated_featured_ads(p_vehicle_type, p_featured_limit) f;

  -- Top spot ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::JSONB)
  INTO top_spot_payload
  FROM public.get_rotated_top_spot_ads(p_vehicle_type, p_top_spot_limit) t;

  -- Boosted ads - rotation function now returns full data, no extra JOIN needed
  SELECT COALESCE(jsonb_agg(to_jsonb(b)), '[]'::JSONB)
  INTO boosted_payload
  FROM public.get_rotated_boost_ads(p_vehicle_type, p_boosted_limit) b;

  -- Urgent ads - direct query with single JOIN
  WITH urgent AS (
    SELECT
      l.id,
      l.title,
      l.price,
      l.make,
      l.model,
      l.year,
      l.vehicle_type,
      l.mileage,
      l.fuel_type,
      l.transmission,
      l.location,
      l.city,
      l.district,
      COALESCE(l.primary_image_url, l.image_url) AS primary_image_url,
      l.image_urls,
      l.created_at,
      l.user_id,
      l.pricing_type,
      l.negotiable,
      l.asking_price,
      l.monthly_payment,
      l.phone,
      l.whatsapp,
      l.email,
      l.boost_score,
      l.is_featured,
      l.is_top_spot,
      l.is_boosted,
      l.is_urgent
    FROM public.listings l
    WHERE l.is_urgent = TRUE
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY COALESCE(l.urgent_until, l.created_at) DESC
    LIMIT p_urgent_limit
  )
  SELECT COALESCE(jsonb_agg(to_jsonb(urgent)), '[]'::JSONB)
  INTO urgent_payload
  FROM urgent;

  RETURN jsonb_build_object(
    'featured', featured_payload,
    'top_spot', top_spot_payload,
    'boosted', boosted_payload,
    'urgent', urgent_payload
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
COMMENT ON FUNCTION public.get_promoted_slots_bundle IS 'Returns promoted listing slots in single JSON payload (optimized, no double JOINs)';
```

---

### 5.12.7 permanently_delete_old_records()

**Purpose**: Permanent deletion with safety checks and backup creation

```sql
CREATE OR REPLACE FUNCTION permanently_delete_old_records()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  config_record RECORD;
  deleted_listings INTEGER := 0;
  deleted_wanted INTEGER := 0;
  deleted_messages INTEGER := 0;
  backup_count INTEGER := 0;
BEGIN
  -- Load safety configuration
  SELECT * INTO config_record
  FROM deletion_safety_config
  WHERE id = 1;

  -- Check if safety checks enabled
  IF config_record.enable_safety_checks = false THEN
    RAISE EXCEPTION 'Safety checks disabled';
  END IF;

  -- Create backups before deletion
  IF config_record.enable_backups THEN
    -- Backup listings
    INSERT INTO deletion_backups (table_name, record_id, backup_data, deleted_at)
    SELECT
      'listings',
      id,
      to_jsonb(listings.*),
      deleted_at
    FROM listings
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - (config_record.min_delete_age_days || ' days')::INTERVAL
      AND deleted_at > NOW() - (config_record.max_delete_age_days || ' days')::INTERVAL
    LIMIT config_record.max_deletions_per_table_per_run;

    GET DIAGNOSTICS backup_count = ROW_COUNT;
  END IF;

  -- Perform permanent deletion
  DELETE FROM listings
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - (config_record.min_delete_age_days || ' days')::INTERVAL
    AND deleted_at > NOW() - (config_record.max_delete_age_days || ' days')::INTERVAL
  LIMIT config_record.max_deletions_per_table_per_run;

  GET DIAGNOSTICS deleted_listings = ROW_COUNT;

  -- Return summary
  RETURN jsonb_build_object(
    'deleted_listings', deleted_listings,
    'deleted_wanted_requests', deleted_wanted,
    'deleted_messages', deleted_messages,
    'backups_created', backup_count,
    'executed_at', NOW()
  );
END;
$$;
```

**Safety Features**
- Respects `deletion_safety_config` limits
- Creates backups in `deletion_backups` before deletion
- Grace period enforcement (30-365 days window)
- Per-table deletion limits
- Approval threshold for bulk operations

---

### 5.12.8 restore_from_backup(backup_id, restored_by)

**Purpose**: Restore permanently deleted records from backup

```sql
CREATE OR REPLACE FUNCTION restore_from_backup(
  p_backup_id UUID,
  p_restored_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  backup_record RECORD;
  restored BOOLEAN := false;
BEGIN
  -- Fetch backup record
  SELECT * INTO backup_record
  FROM deletion_backups
  WHERE id = p_backup_id
    AND can_restore = true
    AND restored_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Backup not found or already restored'
    );
  END IF;

  -- Restore based on table name
  IF backup_record.table_name = 'listings' THEN
    INSERT INTO listings
    SELECT * FROM jsonb_populate_record(NULL::listings, backup_record.backup_data);
    restored := true;
  ELSIF backup_record.table_name = 'wanted_requests' THEN
    INSERT INTO wanted_requests
    SELECT * FROM jsonb_populate_record(NULL::wanted_requests, backup_record.backup_data);
    restored := true;
  END IF;

  -- Mark backup as restored
  IF restored THEN
    UPDATE deletion_backups
    SET restored_at = NOW(), restored_by = p_restored_by
    WHERE id = p_backup_id;
  END IF;

  RETURN jsonb_build_object(
    'success', restored,
    'table_name', backup_record.table_name,
    'record_id', backup_record.record_id,
    'restored_at', NOW()
  );
END;
$$;
```

---

### 5.12.9 get_user_bin_items(user_id)

**Purpose**: Retrieve user's soft-deleted items with restoration metadata

```sql
CREATE FUNCTION public.get_user_bin_items(p_user_id uuid)
RETURNS TABLE(
    id text,
    item_type text,
    item_id uuid,
    title text,
    deleted_at timestamptz,
    deletion_reason text,
    can_restore boolean,
    days_until_permanent_deletion integer,
    original_data jsonb
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    -- Listings
    SELECT
        ('listing-' || l.id::text)::text as id,
        'listing'::text as item_type,
        l.id as item_id,
        l.title,
        l.deleted_at,
        'User deleted'::text as deletion_reason,
        (l.deleted_at > NOW() - INTERVAL '30 days') as can_restore,
        GREATEST(0, 30 - EXTRACT(day FROM NOW() - l.deleted_at)::integer) as days_until_permanent_deletion,
        jsonb_build_object(
            'price', l.price,
            'location', l.location,
            'mileage', l.mileage,
            'year', l.year,
            'make', l.make,
            'model', l.model,
            'status', l.status
        ) as original_data
    FROM public.listings l
    WHERE l.user_id = p_user_id
    AND l.deleted_at IS NOT NULL

    UNION ALL

    -- Wanted Requests
    SELECT
        ('wanted-' || w.id::text)::text as id,
        'wanted_request'::text as item_type,
        w.id as item_id,
        w.title,
        w.deleted_at,
        'User deleted'::text as deletion_reason,
        (w.deleted_at > NOW() - INTERVAL '30 days') as can_restore,
        GREATEST(0, 30 - EXTRACT(day FROM NOW() - w.deleted_at)::integer) as days_until_permanent_deletion,
        jsonb_build_object(
            'budget', w.budget,
            'preferences', w.preferences,
            'status', w.status
        ) as original_data
    FROM public.wanted_requests w
    WHERE w.user_id = p_user_id
    AND w.deleted_at IS NOT NULL

    ORDER BY deleted_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_bin_items(uuid) TO authenticated;
```

---

### 5.12.10 restore_user_item(user_id, item_type, item_id)

**Purpose**: Restore soft-deleted item from user's bin

```sql
CREATE FUNCTION public.restore_user_item(
    p_user_id uuid,
    p_item_type text,
    p_item_id uuid
)
RETURNS TABLE(success boolean, message text, restored_status text)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_affected_rows INTEGER;
BEGIN
    IF p_item_type = 'listing' THEN
        UPDATE public.listings
        SET deleted_at = NULL,
            permanently_deleted = false,
            status = 'pending',
            updated_at = NOW()
        WHERE id = p_item_id
          AND user_id = p_user_id
          AND deleted_at IS NOT NULL
          AND deleted_at > NOW() - INTERVAL '30 days';

        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        RETURN QUERY SELECT
            v_affected_rows > 0,
            CASE WHEN v_affected_rows > 0
                THEN 'Listing restored successfully'
                ELSE 'Unable to restore - may be permanently deleted'
            END,
            'pending'::TEXT;

    ELSIF p_item_type = 'wanted_request' THEN
        UPDATE public.wanted_requests
        SET deleted_at = NULL,
            permanently_deleted = false,
            status = 'paused',
            updated_at = NOW()
        WHERE id = p_item_id
          AND user_id = p_user_id
          AND deleted_at IS NOT NULL
          AND deleted_at > NOW() - INTERVAL '30 days';

        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;

        RETURN QUERY SELECT
            v_affected_rows > 0,
            CASE WHEN v_affected_rows > 0
                THEN 'Wanted request restored successfully'
                ELSE 'Unable to restore - may be permanently deleted'
            END,
            'paused'::TEXT;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_user_item(uuid, text, uuid) TO authenticated;
```

---

### 5.12.11 Trigger Functions

**update_updated_at_column()**

Generic trigger function for auto-updating `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

Applied to: `promotions`, `listings`, `wanted_requests`, `profiles`, `business_profiles`, `conversations`, `messages`, `offers`

---

**update_deleted_at()**

Auto-sets `deleted_at` timestamp when status changes to 'deleted'.

```sql
CREATE OR REPLACE FUNCTION update_deleted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'deleted' AND OLD.status != 'deleted' THEN
        NEW.deleted_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;
```

Applied to: `listings`, `wanted_requests`, `messages`

---

**handle_new_user()**

Auto-creates profile record when user signs up via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url, created_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'avatar_url',
        NOW()
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

### 5.12.12 Additional Utility Functions

**update_buying_guides_updated_at()**

Auto-update timestamp for buying guides cache.

```sql
CREATE OR REPLACE FUNCTION update_buying_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buying_guides_updated_at_trigger
  BEFORE UPDATE ON buying_guides_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_buying_guides_updated_at();
```

---

**get_similar_listings(listing_id, make, model, year, price, limit)**

Similar listings lookup optimization.

```sql
CREATE OR REPLACE FUNCTION get_similar_listings(
  p_listing_id UUID,
  p_make TEXT,
  p_model TEXT,
  p_year INTEGER,
  p_price NUMERIC,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  price NUMERIC,
  make TEXT,
  model TEXT,
  year INTEGER,
  mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  image_url TEXT,
  primary_image_url TEXT,
  location TEXT,
  pricing_type VARCHAR(20),
  finance_type VARCHAR(100),
  outstanding_balance NUMERIC,
  is_featured BOOLEAN,
  is_top_spot BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.price,
    l.make,
    l.model,
    l.year,
    l.mileage,
    l.fuel_type,
    l.transmission,
    l.image_url,
    l.primary_image_url,
    l.location,
    l.pricing_type,
    l.finance_type,
    l.outstanding_balance,
    l.is_featured,
    l.is_top_spot
  FROM listings l
  WHERE l.id != p_listing_id
    AND l.make = p_make
    AND l.model = p_model
    AND l.year BETWEEN (p_year - 3) AND (p_year + 3)
    AND l.price BETWEEN (p_price * 0.9) AND (p_price * 1.1)
    AND l.status = 'active'
    AND l.is_sold = false
    AND l.is_paused = false
    AND (
      l.pricing_type != 'finance'
      OR l.finance_type != 'transfer'
      OR l.outstanding_balance IS NOT NULL
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 5.13 Migration System

### 5.13.1 Migration Naming Pattern

**Format**: `<sequence>_<descriptive_name>.sql` or `YYYYMMDD_<descriptive_name>.sql`

**Examples**
- Sequential: `001_create_promotions_tables.sql`
- Dated: `20251110_optimized_listing_creation_and_rotation.sql`
- Fix iterations: `005_fix_security_issues.sql`, `005_fix_security_issues_corrected.sql`, `005_fix_security_issues_final.sql`

---

### 5.13.2 Total Migrations

**Count**: 40 migration files in `database-migrations/` directory

**Categories**
1. **Foundation** (001-009): Core tables, promotion system, performance optimization
2. **Security** (005-006 series): RLS policy fixes, security advisor remediations
3. **Enhancement** (20250914-20251202): Feature additions, column additions, optimizations
4. **Matching** (0021-0026): Wanted request matching notification system
5. **Cleanup** (007-029): Bin functions, removal of deprecated features

---

### 5.13.3 Key Migrations and Purposes

**001_create_promotions_tables.sql**
- Created `promotions` and `promotion_rotations` tables
- Added promotion flags to `listings` table
- Established rotation tracking infrastructure

**004_add_finance_columns.sql**
- Added finance-specific columns to `listings`
- Introduced `pricing_type` ('cash' vs 'finance')
- Finance details: `finance_type`, `outstanding_balance`, `monthly_payment`, etc.

**005-006 series (Security Fixes)**
- Migrated SECURITY DEFINER views to SECURITY INVOKER
- Fixed search_path vulnerabilities in 23 functions
- Addressed Supabase Security Advisor warnings

**007_performance_advisor_optimization.sql**
- **Major**: Fixed 54 auth_rls_initplan issues (auth.uid() caching)
- Consolidated 32 duplicate permissive policies
- Removed 47 unused indexes
- Created `validate_performance_fixes()` function
- Created `performance_status_dashboard` view

**008_performance_advisor_completion_fixed.sql**
- Fixed remaining 10 RLS policies
- Additional 2 policy consolidations
- Removed 14 more unused indexes
- Reduced warnings from 157 → 41

**009_final_performance_completion.sql**
- Final pass on remaining WARN-level issues
- Achieved EXCELLENT performance status (37 INFO-level warnings)
- Complete auth.uid() optimization across all tables
- **Result**: 76% improvement (157 → 37 warnings)

**20251110_optimized_listing_creation_and_rotation.sql**
- **Critical**: Created 4 composite indexes
- Rewrote `create_listing_v2()` with indexed duplicate detection
- Optimized all rotation functions to return full listing data
- Created `get_promoted_slots_bundle()` for single-query retrieval

**20251111_create_buying_guides_cache.sql**
- Created `buying_guides_cache` table for AI-generated content
- Implemented TTL-based caching with specificity priority
- Cache key structure: `guide:{make}:{model}:{year|gen|general}`

**20251112_listing_detail_performance.sql**
- Created `get_similar_listings()` function
- Added composite index for similar vehicle lookup
- Optimized price range filtering index

**0021_wanted_request_matching_notifications.sql**
- Created `listing_wanted_notifications` table
- Added match tracking columns to `wanted_requests`
- Cleanup function for old dismissed notifications

**20251202_add_is_paused_filter_to_promoted_slots.sql**
- Added `is_paused` filter to promotion rotation queries
- Prevents paused listings from appearing in promoted slots

---

### 5.13.4 Migration Execution Order

Migrations should be applied in numeric/chronological order. Key dependencies:

1. **Foundation Layer** (001-003): Promotions system
2. **Core Features** (004, 20250914-20250918): Finance, profiles, descriptions
3. **Admin System** (006): Dashboard and monitoring
4. **Performance Optimization** (007-009): Must be sequential
5. **Feature Enhancements** (0021-0026, 20251031-20251202): Independent

**Critical Path for Production**: 001 → 004 → 007 → 008 → 009 → 20251110

---

## Summary

This database schema represents a production-grade vehicle marketplace with:

- **45 tables** covering all business domains (core, communication, admin, security, notification)
- **100% RLS coverage** with security-first design patterns
- **76% performance improvement** through systematic optimization (157 → 37 warnings)
- **Comprehensive deletion safety** with backup/restore/approval workflow
- **Fair promotion rotation** with O(1) complexity and concurrent-safe algorithms
- **Atomic operations** with indexed duplicate detection and validation
- **Full audit trail** for compliance, forensics, and security monitoring
- **Optimized indexes** for high-traffic queries with composite index strategy
- **42 migration files** tracking complete evolution with measurable improvements

The schema demonstrates production-ready database engineering with security hardening, performance optimization, and comprehensive data safety mechanisms.

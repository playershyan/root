# Permanent Deletion System Documentation

## Overview
This system implements a 30-day soft delete mechanism for listings, wanted requests, and messages. Items marked as deleted are kept in a "bin" for 30 days before being permanently removed from the database.

## Features

### 1. Soft Delete Tracking
- When a listing, wanted request, or message status is set to 'deleted', the `deleted_at` timestamp is automatically set
- Items remain in the database but are hidden from normal views
- Users can recover items within the 30-day period

### 2. Automatic Permanent Deletion
- Items deleted more than 30 days ago are automatically permanently removed
- Deletion logs are maintained for audit purposes
- Original data is archived in JSON format before deletion

### 3. Database Components

#### Tables
- **listings**: Added columns for soft delete tracking
  - `deleted_at`: Timestamp when item was deleted
  - `deletion_reason`: Optional reason for deletion
  - `permanently_deleted`: Boolean flag (always false until permanent deletion)

- **wanted_requests**: Similar soft delete columns as listings

- **messages**: Soft delete tracking for chat messages
  - `status`: Message status ('active' or 'deleted')
  - `deleted_at`: Timestamp when message was deleted
  - `deletion_reason`: Optional reason for deletion
  - `permanently_deleted`: Boolean flag

- **deletion_logs**: Audit trail of permanent deletions
  - Stores deleted record data in JSON format
  - Tracks who deleted what and when

#### Functions
- **update_deleted_at()**: Trigger function that automatically sets deleted_at when status changes
- **permanently_delete_old_records()**: Main cleanup function that deletes items older than 30 days

#### Views
- **pending_permanent_deletion**: Shows all items awaiting permanent deletion with their scheduled deletion dates

### 4. Edge Function
The `cleanup-deleted-items` Edge Function provides an HTTP endpoint for triggering cleanup:

```bash
POST https://[project-ref].supabase.co/functions/v1/cleanup-deleted-items
Authorization: Bearer [service-role-key]
```

Response:
```json
{
  "success": true,
  "deleted": {
    "listings": 5,
    "wanted_requests": 2,
    "messages": 8
  },
  "timestamp": "2025-08-22T02:35:00.000Z"
}
```

### 5. API Endpoints

#### Admin Cleanup Endpoint
`POST /api/admin/cleanup` - Manually trigger cleanup (admin only)
`GET /api/admin/cleanup` - View pending deletions and recent logs

### 6. Cron Schedule
The system runs automatically using pg_cron with **SAFETY MECHANISMS**:
- Daily at 2:00 AM UTC: Safe deletion of old items (with multiple safety checks)
- Weekly on Mondays: Summary report of pending deletions

### 7. 🛡️ Safety Mechanisms

#### Multi-Layer Protection:
1. **Safety Checks**: Automatic validation before deletion
2. **Rate Limiting**: Maximum deletions per run (50 per table, 100 total)
3. **Admin Approval**: Large batches require manual approval
4. **Backup System**: Complete data backup before deletion
5. **Recovery Tools**: Ability to restore deleted items

#### Safety Configuration:
- **Max deletions per run**: 100 items total
- **Max deletions per table**: 50 items per table type
- **Admin approval threshold**: 20+ items require approval
- **Minimum age**: 30 days (configurable)
- **Maximum age**: 365 days (prevents corrupted data deletion)

## Setup Instructions

### 1. Apply Database Migrations
```sql
-- Run the migration file: supabase/migrations/005_add_soft_delete_tracking.sql
```

### 2. Deploy Edge Function
```bash
supabase functions deploy cleanup-deleted-items
```

### 3. Set Environment Variables
Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAILS=admin1@example.com,admin2@example.com
CLEANUP_CRON_SECRET=your-secret-token
```

### 4. Enable Cron Jobs (✅ ALREADY CONFIGURED)
The automatic cleanup is already enabled with the following schedule:
- **Daily Cleanup**: Every day at 2:00 AM UTC
- **Weekly Summary**: Every Monday at 9:00 AM UTC

Check active cron jobs:
```sql
SELECT jobid, jobname, schedule, active FROM cron.job;
```

## Testing

### Create Test Data
```sql
-- Insert a test listing with old deletion date
UPDATE listings 
SET status = 'deleted', deleted_at = NOW() - INTERVAL '35 days'
WHERE id = 'some-test-id';
```

### Run Cleanup Manually
```sql
SELECT * FROM permanently_delete_old_records();
```

### Check Results
```sql
-- View pending deletions
SELECT * FROM pending_permanent_deletion;

-- View deletion logs
SELECT * FROM deletion_logs ORDER BY created_at DESC;
```

## 🔍 Monitoring the System

### Quick Status Check
```sql
-- Check what's pending deletion
SELECT * FROM pending_permanent_deletion;

-- View cleanup history
SELECT * FROM deletion_logs ORDER BY created_at DESC;

-- Check safety status
SELECT * FROM deletion_safety_status;
```

### 🛡️ Safety Monitoring
```sql
-- View pending approval requests
SELECT * FROM deletion_approval_requests WHERE status = 'pending';

-- Check available backups for restoration
SELECT * FROM deletion_backups WHERE can_restore = true AND restored_at IS NULL;

-- Run safety check manually
SELECT * FROM check_deletion_safety();
```

### Detailed Analytics

#### Check Pending Deletions by Type
```sql
SELECT 
    type,
    COUNT(*) as count,
    MIN(scheduled_permanent_deletion) as next_deletion
FROM pending_permanent_deletion
GROUP BY type;
```

#### View Deletion History Summary
```sql
SELECT 
    table_name,
    COUNT(*) as deleted_count,
    DATE(permanently_deleted_at) as deletion_date
FROM deletion_logs
GROUP BY table_name, DATE(permanently_deleted_at)
ORDER BY deletion_date DESC;
```

#### Check Cron Job Status
```sql
-- Verify automatic cleanup is running
SELECT jobid, jobname, schedule, active FROM cron.job;
```

## Recovery

If an item needs to be recovered before permanent deletion:

```sql
-- Recover a listing
UPDATE listings 
SET status = 'active', deleted_at = NULL, deletion_reason = NULL
WHERE id = 'listing-id' AND deleted_at IS NOT NULL;

-- Recover a wanted request
UPDATE wanted_requests 
SET status = 'active', deleted_at = NULL, deletion_reason = NULL
WHERE id = 'request-id' AND deleted_at IS NOT NULL;

-- Recover a message
UPDATE messages 
SET status = 'active', deleted_at = NULL, deletion_reason = NULL
WHERE id = 'message-id' AND deleted_at IS NOT NULL;
```

## 🛡️ Safety Features & Recovery

### Admin Actions via API
```bash
# View safety status and pending approvals
GET /api/admin/deletion-safety

# Approve a large deletion batch
POST /api/admin/deletion-safety
{
  "action": "approve_deletion",
  "request_id": "uuid-here"
}

# Restore an item from backup
POST /api/admin/deletion-safety
{
  "action": "restore_backup", 
  "backup_id": "uuid-here"
}

# Run safe cleanup manually
POST /api/admin/deletion-safety
{
  "action": "run_safe_cleanup"
}
```

### Safety Failures
The system will **BLOCK** automatic deletion if:
- More than 100 items are pending deletion
- Items marked for deletion are too recent (< 1 day)
- Items are older than 365 days (data corruption risk)
- Recent deletion activity detected (< 1 hour ago)

### Backup Recovery
Every deleted item is backed up before permanent deletion:
```sql
-- Find backups for a specific item
SELECT * FROM deletion_backups WHERE record_id = 'item-uuid';

-- Restore via SQL (admin only)
SELECT restore_from_backup('backup-uuid', 'admin-user-uuid');
```

## Important Notes

1. **Data Recovery**: Once permanently deleted (after 30 days), data cannot be recovered from the main tables but is archived in deletion_logs
2. **Performance**: Indexes are created on deleted_at columns for efficient cleanup queries
3. **Security**: Only authenticated users can trigger manual cleanup via the API
4. **Audit Trail**: All permanent deletions are logged with full record data
5. **Time Zone**: All timestamps are stored in UTC

## Troubleshooting

### Items Not Being Deleted
1. Check if deleted_at is properly set
2. Verify the item is older than 30 days
3. Check if permanently_deleted flag is false
4. Review deletion_logs for any errors

### Function Not Running
1. Check Edge Function logs in Supabase dashboard
2. Verify cron job is scheduled: `SELECT * FROM cron.job;`
3. Check database function permissions

### Performance Issues
1. Ensure indexes exist on deleted_at columns
2. Consider increasing the cleanup frequency if many items accumulate
3. Archive old deletion_logs periodically
# OTP Cleanup Automation

Automated cleanup system for expired OTP verification records.

## Overview

The OTP cleanup system automatically removes expired phone verification records to maintain database hygiene and prevent table bloat. It runs daily via Vercel Cron Jobs.

## Architecture

### Components

1. **Database Function**: `cleanup_expired_otp_records()`
   - Deletes expired unverified records (>24 hours old)
   - Counts orphaned verified records (for monitoring)
   - Counts invalid phone format records

2. **API Route**: `/api/cron/cleanup-otp`
   - Executes cleanup function
   - Logs results to Sentry
   - Returns detailed statistics

3. **Cron Schedule**: Daily at 2:00 AM UTC
   - Configured in `vercel.json`
   - Uses CRON_SECRET for authentication

## Configuration

### Environment Variables

```bash
# Required for cron authentication
CRON_SECRET=your-secret-key-here

# Required for database access
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
```

### Vercel Cron Setup

Configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-otp",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Format**: Cron expression `0 2 * * *` (daily at 2 AM UTC)

## Monitoring

### Viewing Logs

**Vercel Dashboard:**
1. Go to your project → Deployments
2. Click on the latest deployment
3. Navigate to Functions → `/api/cron/cleanup-otp`
4. View execution logs

**Sentry:**
- All cleanup operations are logged to Sentry
- Search for: `OTP cleanup completed`
- Warnings/errors tagged with context

### Key Metrics

The cleanup job returns:

```json
{
  "success": true,
  "timestamp": "2025-11-16T02:00:00.000Z",
  "cleanup": {
    "deletedRecords": 47,
    "orphanedRecords": 2,
    "invalidFormatRecords": 0
  },
  "currentStats": {
    "totalRecords": 156,
    "verifiedRecords": 89,
    "unverifiedRecords": 67,
    "expiredRecords": 0,
    "recordsLast24h": 45,
    "avgVerificationTimeSeconds": 12.3
  }
}
```

### Alerts

**Automated Warnings:**
- **Orphaned Records > 10**: Indicates records not linked to users
- **Invalid Format Records > 0**: Data integrity issue requiring investigation

**What to Monitor:**
- Deletion count (should be consistent with daily traffic)
- Orphaned record trend (should remain low)
- Average verification time (baseline: 10-30 seconds)

## Manual Execution

### Via API Call

```bash
# Local testing
curl -X GET "http://localhost:3000/api/cron/cleanup-otp" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Production
curl -X GET "https://your-domain.com/api/cron/cleanup-otp" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Via Database

Direct SQL execution:

```sql
-- Run cleanup
SELECT * FROM cleanup_expired_otp_records();

-- Check results
-- Returns: deleted_count, orphaned_count, invalid_format_count
```

### Via Supabase Dashboard

1. Go to SQL Editor
2. Run:
   ```sql
   SELECT * FROM cleanup_expired_otp_records();
   ```
3. View results

## Statistics Function

Get real-time OTP system statistics:

```sql
SELECT * FROM get_otp_stats();
```

**Returns:**
- `total_records`: Total OTP records in database
- `verified_records`: Successfully verified OTPs
- `unverified_records`: Pending verifications
- `expired_records`: Unverified records past expiry
- `orphaned_records`: Verified records without user_id
- `records_last_24h`: Recent activity
- `avg_verification_time_seconds`: User verification speed

## Troubleshooting

### Cleanup Not Running

**Check:**
1. Vercel Cron is enabled (Pro plan required)
2. `CRON_SECRET` environment variable is set
3. Function logs for errors

**Solution:**
```bash
# Redeploy to refresh cron configuration
vercel --prod
```

### High Orphaned Record Count

**Cause:** Phone verifications not linked to users after registration

**Investigation:**
```sql
-- Find orphaned records
SELECT * FROM phone_verifications
WHERE verified = true AND user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Fix:**
```sql
-- Link orphaned records to users
UPDATE phone_verifications pv
SET user_id = au.id
FROM auth.users au
WHERE pv.verified = true
  AND pv.user_id IS NULL
  AND au.phone = '+' || pv.phone_number;
```

### Invalid Format Records

**Cause:** Phone numbers not matching canonical format (94XXXXXXXXX)

**Investigation:**
```sql
-- Find invalid formats
SELECT phone_number, COUNT(*) as count
FROM phone_verifications
WHERE phone_number !~ '^94[0-9]{9}$'
GROUP BY phone_number;
```

**Fix:**
```sql
-- Delete invalid records (run cleanup migration again)
DELETE FROM phone_verifications
WHERE phone_number !~ '^94[0-9]{9}$'
  AND verified = false
  AND expires_at < NOW() - INTERVAL '7 days';
```

## Performance

### Database Impact

- **Execution Time**: < 100ms (typical)
- **Records Deleted**: 20-100 per day (varies with traffic)
- **Index Used**: `idx_phone_verifications_cleanup`

### Optimization

The cleanup uses an optimized index:

```sql
CREATE INDEX idx_phone_verifications_cleanup
ON phone_verifications (verified, expires_at)
WHERE verified = false;
```

**Benefits:**
- Fast expired record identification
- Minimal table lock duration
- No impact on active OTP operations

## Maintenance

### Recommended Actions

**Weekly:**
- Review cleanup logs for anomalies
- Check orphaned record trends

**Monthly:**
- Analyze average verification times
- Review total record growth

**Quarterly:**
- Verify index performance
- Consider table archival if > 10,000 verified records

### Table Archival

If verified records exceed storage limits:

```sql
-- Archive old verified records (>6 months)
CREATE TABLE phone_verifications_archive AS
SELECT * FROM phone_verifications
WHERE verified = true
  AND verified_at < NOW() - INTERVAL '6 months';

-- Delete archived records
DELETE FROM phone_verifications
WHERE verified = true
  AND verified_at < NOW() - INTERVAL '6 months';
```

## Related Documentation

- [OTP Flow Implementation](../implementation/PHONE_OTP_VERIFICATION_PLAN.md)
- [Phone Normalization Guide](../guides/SMS_OTP_FIXED.md)
- [Database Schema](../database/SUPABASE_DATABASE_ANALYSIS.md)
- [Monitoring Setup](../setup/SENTRY_SETUP.md)

## Change Log

- **2025-11-16**: Initial implementation with daily cleanup
- **2025-11-16**: Added monitoring functions and alerting
- **2025-11-16**: Deployed to production with Vercel Cron

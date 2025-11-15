# Rate Limiting Reset Guide

## Overview

This guide explains how to reset rate limiters across the vera.lk application. Rate limiting protects the application from abuse, but sometimes you need to reset limits for legitimate reasons (testing, user support, etc.).

## Table of Contents

1. [Understanding Rate Limiting Systems](#understanding-rate-limiting-systems)
2. [Reset Script Usage](#reset-script-usage)
3. [Reset Methods](#reset-methods)
4. [Common Scenarios](#common-scenarios)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)

---

## Understanding Rate Limiting Systems

### Rate Limiter Types

The application uses **two types of rate limiting**:

#### 1. **In-Memory Rate Limiters** (LRUCache)
- **Location**: `lib/middleware/rateLimiter.ts`
- **Storage**: Server memory
- **Reset Method**: Server restart or redeploy
- **Limits**:
  - API: 100 requests/minute
  - Auth: 5 attempts/15 minutes
  - Search: 30 requests/minute
  - Upload: 15 requests/minute
  - Messaging: 20 messages/minute
  - AI: 10 requests/minute
  - Admin: 50 requests/minute
  - Strict: 20 requests/15 minutes

#### 2. **Database-Based OTP Rate Limiting**
- **Location**: `app/api/auth/send-phone-otp/route.ts`
- **Storage**: `phone_verifications` table in Supabase
- **Reset Method**: Delete records from database (script)
- **Limit**: 3 OTPs per hour per phone number

#### 3. **Redis/Upstash Rate Limiters** (Optional)
- **Status**: Not currently configured
- **Storage**: Redis/Upstash (if configured)
- **Reset Method**: Clear Redis keys (script)

---

## Reset Script Usage

### Script Location

```
scripts/reset-rate-limits.js
```

### Basic Syntax

```bash
node scripts/reset-rate-limits.js [options]
```

### Prerequisites

1. **Environment Variables** (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Optional (if using Redis):
   USE_UPSTASH=true
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   ```

2. **Node.js** installed
3. **Dependencies** installed (`npm install`)

---

## Reset Methods

### Option 1: Reset All Rate Limiters

Reset everything that can be reset (OTP database, Redis if configured).

```bash
node scripts/reset-rate-limits.js --all
```

**What it does**:
- Shows in-memory rate limiter info
- Resets Redis rate limiters (if configured)
- Resets all OTP rate limits in database
- Resets IP quarantine records (if applicable)

**Output Example**:
```
🚀 Rate Limiter Reset Tool
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 In-Memory Rate Limiters Info...
💡 In-memory rate limiters (LRUCache) are stored in server memory.
💡 They automatically reset when the server restarts.
⚠️  Cannot reset in-memory limiters from script (require server restart).

🔄 Resetting all OTP rate limits...
✅ Reset OTP rate limits! Deleted 12 OTP records.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Reset Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Redis: ⚪ Skipped (not configured)
  OTP: ✅ Reset (12 records deleted)
  IP Quarantine: ⚪ Skipped

✨ Rate limit reset complete!
```

---

### Option 2: Reset OTP Rate Limits Only

Reset the database-based OTP rate limiting that prevents "Too many OTP requests" errors.

```bash
node scripts/reset-rate-limits.js --otp
```

**Use Cases**:
- User reports "Too many OTP requests" error
- Testing OTP functionality
- Legitimate user needs immediate access

**What it does**:
- Deletes all OTP records from `phone_verifications` table from the last hour
- Allows users to request new OTPs immediately

---

### Option 3: Reset OTP Rate Limit for Specific Phone Number

Reset rate limiting for a specific phone number.

```bash
node scripts/reset-rate-limits.js --phone 94771234567
```

**Supported Formats**:
```bash
# International format (with country code)
node scripts/reset-rate-limits.js --phone 94771234567

# International format (with +)
node scripts/reset-rate-limits.js --phone +94771234567

# Local format (with leading 0)
node scripts/reset-rate-limits.js --phone 0771234567
```

**Use Cases**:
- Specific user support request
- Testing with a specific phone number
- Clear rate limit for one user without affecting others

**Example**:
```bash
node scripts/reset-rate-limits.js --phone 94771234567
```

**Output**:
```
🔄 Resetting OTP rate limit for phone: 94771234567
✅ Reset OTP rate limits! Deleted 3 OTP records.
✨ You can now request a new OTP for 94771234567
```

---

### Option 4: Reset Redis Rate Limiters (If Configured)

Reset Redis/Upstash rate limiters (only if Redis is configured).

```bash
node scripts/reset-rate-limits.js --redis
```

**Use Cases**:
- Redis-based rate limiting is active
- Need to clear distributed rate limits across instances
- Testing with Redis backend

**Note**: If Redis is not configured, this will be skipped with a message.

---

### Option 5: Reset IP Quarantine Records

Clear IP quarantine/block records (if using quarantine system).

```bash
node scripts/reset-rate-limits.js --ip-quarantine
```

**Use Cases**:
- Unblock specific IPs that were quarantined
- Clear security strike records
- Testing quarantine system

---

### Option 6: Combine Multiple Options

Reset multiple rate limiter types at once.

```bash
# Reset Redis and OTP rate limiters
node scripts/reset-rate-limits.js --redis --otp

# Reset OTP and IP quarantine
node scripts/reset-rate-limits.js --otp --ip-quarantine
```

---

### Option 7: Show Help

Display help message with all available options.

```bash
node scripts/reset-rate-limits.js --help
```

---

## Common Scenarios

### Scenario 1: User Can't Request OTP

**Problem**: User sees "Too many OTP requests. Please wait an hour before requesting again."

**Solution**:
```bash
# If you know the phone number:
node scripts/reset-rate-limits.js --phone 94771234567

# Or reset all OTP rate limits:
node scripts/reset-rate-limits.js --otp
```

**After Reset**: User can immediately request a new OTP.

---

### Scenario 2: Testing OTP Functionality

**Problem**: Need to test OTP sending multiple times.

**Solution**:
```bash
# Reset OTP rate limits before testing
node scripts/reset-rate-limits.js --otp

# Then test OTP sending in your app
```

**Best Practice**: Reset after each test iteration if hitting rate limits.

---

### Scenario 3: API Rate Limits Blocking Development

**Problem**: In-memory rate limiters blocking development/testing.

**Solution**:
```bash
# Option 1: Restart development server
# Stop server (Ctrl+C) and restart:
npm run dev

# Option 2: Redeploy in production
# Deploy new version to Vercel (triggers reset)
```

**Note**: In-memory rate limiters reset automatically on server restart.

---

### Scenario 4: Production Emergency - Rate Limit Reset

**Problem**: Legitimate users hitting rate limits in production.

**Solution**:
```bash
# SSH into server or use Vercel CLI
# Then run:
node scripts/reset-rate-limits.js --otp

# Or for specific user:
node scripts/reset-rate-limits.js --phone 94771234567
```

**Best Practice**: Only reset for legitimate users. Monitor for abuse.

---

### Scenario 5: Testing After Rate Limit Changes

**Problem**: Need to test new rate limit configurations.

**Solution**:
```bash
# 1. Reset all rate limiters
node scripts/reset-rate-limits.js --all

# 2. Make configuration changes in code

# 3. Restart server to apply changes

# 4. Test with clean slate
```

---

## Troubleshooting

### Error: Missing Environment Variables

**Error Message**:
```
❌ Error: Missing Supabase environment variables
Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

**Solution**:
1. Ensure `.env.local` file exists in project root
2. Add required environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Get service role key from Supabase Dashboard → Settings → API

---

### Error: Cannot Connect to Database

**Error Message**:
```
❌ Error: Failed to connect to Supabase
```

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is valid
3. Check network connectivity
4. Verify Supabase project is active

---

### Warning: Redis Not Configured

**Message**:
```
⚠️  Redis/Upstash not configured.
💡 Using in-memory rate limiters instead (resets on server restart).
```

**This is Normal**: If you're not using Redis, this is expected. The script will skip Redis reset and continue with other operations.

---

### In-Memory Rate Limiters Still Active

**Problem**: Reset script ran successfully, but API rate limits still apply.

**Explanation**: In-memory rate limiters cannot be reset via script. They require server restart.

**Solution**:
1. **Development**: Restart dev server (`npm run dev`)
2. **Production**: Redeploy application (Vercel/hosting platform)

**Alternative**: Wait for rate limit window to expire (varies by endpoint).

---

### Phone Number Format Issues

**Problem**: Script says it reset, but phone number format seems wrong.

**Solution**: The script automatically formats phone numbers:
- `0771234567` → `94771234567`
- `+94771234567` → `94771234567`
- `94771234567` → `94771234567` (no change)

**Verify**: Check database to confirm records were deleted:
```sql
SELECT * FROM phone_verifications 
WHERE phone_number = '94771234567' 
AND created_at > NOW() - INTERVAL '1 hour';
```

---

### Script Runs But No Records Deleted

**Possible Reasons**:
1. No OTP records exist in the last hour (already expired)
2. Phone number doesn't match (format mismatch)
3. Database query issue

**Solution**:
```bash
# Check what records exist:
# Connect to Supabase and run:
SELECT phone_number, created_at, verified 
FROM phone_verifications 
ORDER BY created_at DESC 
LIMIT 10;

# Then verify the phone number format matches
```

---

## Best Practices

### 1. **Use Specific Resets When Possible**

❌ **Don't**: Always reset all rate limiters
```bash
node scripts/reset-rate-limits.js --all
```

✅ **Do**: Reset only what you need
```bash
node scripts/reset-rate-limits.js --phone 94771234567
```

**Why**: Prevents accidentally clearing legitimate rate limit protections.

---

### 2. **Verify Before Resetting**

✅ **Do**: Verify the user's phone number before resetting
```bash
# Get phone number from user
# Verify it matches the format in database
# Then reset
node scripts/reset-rate-limits.js --phone <verified_number>
```

---

### 3. **Document Resets**

✅ **Do**: Keep a log of rate limit resets for security monitoring:

```markdown
## Rate Limit Resets Log

| Date | Phone Number | Reason | Reset By |
|------|--------------|--------|----------|
| 2025-01-15 | 94771234567 | User support - legit request | admin |
| 2025-01-16 | 94771234568 | Testing | developer |
```

---

### 4. **Monitor for Abuse**

✅ **Do**: Monitor rate limit reset frequency

**Red Flags**:
- Same phone number reset multiple times in short period
- Many resets without legitimate reasons
- Unusual patterns

**Action**: If abuse detected, investigate before resetting.

---

### 5. **Use for Legitimate Reasons Only**

✅ **Legitimate Use Cases**:
- User support requests
- Development/testing
- Configuration changes
- Production emergencies (legitimate users blocked)

❌ **Not for**:
- Bypassing security measures
- Automated testing without proper setup
- Ignoring rate limit issues without investigation

---

### 6. **Automate in Development**

✅ **Development**: Create a helper script:

```bash
#!/bin/bash
# scripts/dev-reset-rate-limits.sh

echo "Resetting rate limits for development..."
node scripts/reset-rate-limits.js --otp
echo "✅ Ready for testing!"
```

Then use: `./scripts/dev-reset-rate-limits.sh`

---

### 7. **Restart Server for In-Memory Resets**

✅ **Remember**: In-memory rate limiters require server restart:

```bash
# Development
npm run dev  # Restart with Ctrl+C then restart

# Production
# Redeploy or restart deployment
```

---

## Security Considerations

### ⚠️ Important Security Notes

1. **Service Role Key**: The script requires `SUPABASE_SERVICE_ROLE_KEY` which has admin access. Keep it secure.

2. **Production Use**: Use rate limit resets carefully in production. Frequent resets may indicate:
   - Security issues (abuse attempts)
   - Configuration problems (limits too strict)
   - User experience issues

3. **Audit Trail**: Consider logging all rate limit resets to database for security auditing.

4. **IP Quarantine**: Resetting IP quarantine may unblock malicious IPs. Verify before resetting.

5. **Rate Limit Configuration**: If resets are frequent, consider reviewing rate limit configurations rather than constantly resetting.

---

## Quick Reference

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `--all` | Reset everything possible | Full reset needed |
| `--otp` | Reset all OTP rate limits | Testing or general reset |
| `--phone <num>` | Reset specific phone number | User support |
| `--redis` | Reset Redis rate limiters | Redis configured and needed |
| `--ip-quarantine` | Reset IP blocks | Unblock specific IPs |
| `--help` | Show help | Need command reference |

---

## Related Documentation

- [Rate Limiter Overview](./RATE_LIMITER_OVERVIEW.md)
- [Security Implementation Status](../SECURITY_IMPLEMENTATION_STATUS.md)
- [DDoS Mitigation Implementation](./ddos-mitigation-implementation.md)

---

## Support

If you encounter issues with rate limiting or reset commands:

1. Check [Troubleshooting](#troubleshooting) section
2. Verify environment variables are set correctly
3. Check Supabase dashboard for database connectivity
4. Review application logs for detailed error messages

---

**Last Updated**: 2025-01-15  
**Script Version**: 1.0.0


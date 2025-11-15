# How to Enable Existing Redis Support

## Quick Start (5 minutes)

Your codebase already has Redis support built-in. You just need to:
1. Sign up for Upstash Redis (free tier available)
2. Get your credentials
3. Add environment variables
4. Enable it

---

## Step-by-Step Guide

### Step 1: Create Upstash Redis Account

1. **Go to:** https://upstash.com/
2. **Sign up** (free account)
3. **Click:** "Create Database"
4. **Select:**
   - **Region:** Choose closest to your servers (e.g., `us-east-1` for US)
   - **Type:** Redis
   - **Plan:** Free tier (10K commands/day) or paid if needed
   - **Name:** `vera-rate-limiting` (or your preference)

### Step 2: Get Your Credentials

1. **After database is created**, click on it
2. **Go to:** "REST API" tab (or "Details" tab)
3. **Copy these two values:**
   - `UPSTASH_REDIS_REST_URL` (starts with `https://`)
   - `UPSTASH_REDIS_REST_TOKEN` (long alphanumeric string)

**Example:**
```
UPSTASH_REDIS_REST_URL=https://elegant-owl-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Add Environment Variables

#### For Local Development

**Option A: `.env.local` file** (recommended for local)
```bash
# .env.local
USE_UPSTASH=true
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Option B: System environment variables**
```bash
# Windows (PowerShell)
$env:USE_UPSTASH="true"
$env:UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
$env:UPSTASH_REDIS_REST_TOKEN="your-token-here"

# Linux/Mac
export USE_UPSTASH=true
export UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="your-token-here"
```

#### For Production (Vercel)

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Add these three variables:**
   - `USE_UPSTASH` = `true`
   - `UPSTASH_REDIS_REST_URL` = `https://your-redis-url.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `your-token-here`
3. **Select environments:** Production, Preview, Development (or as needed)
4. **Click:** "Save"
5. **Redeploy** your application

#### For Production (Render.com)

1. **Go to:** Render Dashboard → Your Service → Environment
2. **Add these three variables:**
   - `USE_UPSTASH` = `true`
   - `UPSTASH_REDIS_REST_URL` = `https://your-redis-url.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `your-token-here`
3. **Click:** "Save Changes"
4. **Redeploy** your service

---

## Step 4: Verify It's Working

### Check 1: Environment Variables

```bash
# In your terminal, check if variables are set
echo $USE_UPSTASH
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

### Check 2: Test Redis Connection

Create a test script to verify connection:

**File:** `scripts/test-redis.js`
```javascript
// scripts/test-redis.js
const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

async function test() {
  try {
    // Test connection
    const pong = await redis.ping()
    console.log('✅ Redis connection successful:', pong)
    
    // Test set/get
    await redis.set('test:key', 'Hello Redis!')
    const value = await redis.get('test:key')
    console.log('✅ Redis set/get test:', value)
    
    // Test rate limiter
    await redis.incr('test:counter')
    const count = await redis.get('test:counter')
    console.log('✅ Redis counter test:', count)
    
    // Cleanup
    await redis.del('test:key', 'test:counter')
    console.log('✅ All tests passed!')
  } catch (error) {
    console.error('❌ Redis test failed:', error.message)
    process.exit(1)
  }
}

test()
```

**Run the test:**
```bash
node scripts/test-redis.js
```

### Check 3: Test Rate Limiting

After deploying with Redis enabled:

1. **Check logs** for Redis usage:
   - Look for: `"Using Upstash for rate limiting"` or similar
   - Should NOT see: `"Falling back to in-memory"` (unless Redis is down)

2. **Test rate limiting** by hitting an endpoint multiple times:
   ```bash
   # Test API rate limit (should allow 100/min)
   for i in {1..105}; do curl https://your-domain.com/api/some-endpoint; done
   ```
   - Should get rate limited after 100 requests
   - Rate limits should persist across server restarts

3. **Check Upstash Dashboard:**
   - Go to your Upstash database dashboard
   - Click "Monitoring" or "Logs"
   - You should see command activity

### Check 4: Verify Metrics are Being Written

1. **Check metrics** in Redis:
   ```bash
   # Via Upstash Console or Redis CLI
   # Keys should start appearing with prefixes:
   # - rl:api:* (rate limiting)
   # - metrics:* (metrics)
   ```

2. **Check application logs** for Redis writes

---

## What Gets Enabled

Once you set `USE_UPSTASH=true`, the following features will use Redis:

### ✅ Rate Limiting (lib/middleware/rateLimiter.ts)
- **All 11 rate limiters** will use Redis:
  - API: 100 req/min
  - Auth: 5/15min
  - OTP: 3/hour
  - Search: 30/min
  - Upload: 10/hour
  - Messaging: 20/min
  - AI: 10/min + 100/day
  - Admin: 50/min
  - Strict: 3/hour
  - Report: 5/hour
  - Contact: 3/15min

- **Benefits:**
  - Consistent limits across multiple instances
  - Persistent across server restarts
  - IP quarantine in Redis

### ✅ Metrics (lib/security/metrics.ts)
- **Distributed counters** for:
  - Rate limit hits/blocks
  - Daily metrics
  - Admin audit logs
  - Trend tracking

- **Benefits:**
  - Metrics persist across restarts
  - Available across all instances

### ⚠️ Rate Limiter (lib/security/redis-rate-limiter.ts)
- **Already uses Redis** if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- **Doesn't need** `USE_UPSTASH` flag (checks env vars directly)

---

## Troubleshooting

### Problem: Redis not connecting

**Check:**
1. ✅ Environment variables are set correctly
2. ✅ `USE_UPSTASH=true` (for rateLimiter.ts)
3. ✅ URLs and tokens are correct (no extra spaces)
4. ✅ Upstash database is active (check dashboard)

**Debug:**
```bash
# Check if variables are loaded
node -e "console.log('USE_UPSTASH:', process.env.USE_UPSTASH)"
node -e "console.log('URL:', process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'NOT SET')"
node -e "console.log('TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'NOT SET')"
```

### Problem: Rate limits still reset on restart

**Cause:** Still using in-memory fallback

**Fix:**
1. Check `USE_UPSTASH=true` is set
2. Check Redis credentials are correct
3. Check application logs for Redis errors
4. Test Redis connection (use test script above)

### Problem: Too many commands (free tier limit)

**Symptoms:**
- Getting errors after 10K commands/day
- Rate limiting stops working

**Solutions:**
1. **Upgrade Upstash plan** (paid tier)
2. **Optimize command usage:**
   - Reduce rate limit checks (cache results)
   - Batch operations
   - Increase TTL to reduce writes

### Problem: Fallback to in-memory

**Normal behavior if:**
- Redis is temporarily down
- Network issues
- Connection timeout

**Check logs:**
- Look for: `"Redis health check failed"`
- System will automatically fallback and retry

---

## Monitoring

### Upstash Dashboard

1. **Go to:** https://console.upstash.com/
2. **Click:** Your database
3. **Monitor:**
   - Command count (should match your usage)
   - Memory usage
   - Errors
   - Latency

### Application Logs

Look for these log messages:
- `"Using Upstash for rate limiting"` ✅ Working
- `"Redis connection failed, using fallback"` ⚠️ Fallback active
- `"Rate limit exceeded"` ✅ Rate limiting working

### Cost Monitoring

**Free Tier:**
- 10,000 commands/day
- ~333 commands/hour
- Monitor in Upstash dashboard

**Estimate usage:**
- Rate limit check: ~2 commands per request
- 1,000 requests/hour = ~2,000 commands/hour
- Free tier handles ~150 requests/hour

**If you exceed:**
- Upgrade to paid tier ($0.20 per 100K commands)
- Or optimize command usage

---

## Next Steps

### Immediate (After Enabling)
- [ ] Verify Redis is working (use test script)
- [ ] Monitor for 24 hours
- [ ] Check command usage
- [ ] Verify rate limits persist across restarts

### Short-term (1 Week)
- [ ] Monitor costs
- [ ] Check rate limit effectiveness
- [ ] Verify multi-instance consistency (if applicable)

### Long-term (1 Month)
- [ ] Review usage patterns
- [ ] Optimize if needed
- [ ] Consider upgrading plan if close to limits
- [ ] Plan for full cache/session migration if needed

---

## Quick Reference

### Environment Variables Needed

```bash
# Required to enable Redis
USE_UPSTASH=true

# Required for connection
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### Files That Use Redis

1. **lib/middleware/rateLimiter.ts**
   - Checks `USE_UPSTASH`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - Falls back to in-memory if not set

2. **lib/security/redis-rate-limiter.ts**
   - Checks `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` directly
   - No `USE_UPSTASH` flag needed

3. **lib/security/metrics.ts**
   - Checks `USE_UPSTASH`, `UPSTASH_REDIS_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
   - Falls back to in-memory if not set

### Verify It's Working

```bash
# Test connection
node scripts/test-redis.js

# Check environment variables
echo $USE_UPSTASH
echo $UPSTASH_REDIS_REST_URL

# Check application logs for Redis usage
# Look for: "Using Upstash" or "Redis connection"
```

---

## Summary

**To enable Redis support:**

1. ✅ Sign up for Upstash (free tier)
2. ✅ Create Redis database
3. ✅ Copy credentials (URL + Token)
4. ✅ Add environment variables:
   - `USE_UPSTASH=true`
   - `UPSTASH_REDIS_REST_URL=...`
   - `UPSTASH_REDIS_REST_TOKEN=...`
5. ✅ Deploy/Restart application
6. ✅ Verify it's working (test script)

**That's it!** Your existing code will automatically use Redis once these variables are set.

---

**Need Help?**
- Upstash Docs: https://docs.upstash.com/redis
- Upstash Discord: https://upstash.com/discord
- Check application logs for errors


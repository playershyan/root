# Geographic Latency Fix - Singapore Deployment

## Problem Identified

Your infrastructure has a **triple-region latency problem**:

```
Sri Lankan Users (Colombo) → 170ms → Vercel (Virginia) → 200ms → Supabase (Singapore)
```

### Current Setup (VERY BAD):
- **Users**: Sri Lanka 🇱🇰
- **Vercel**: US East (Virginia - iad1) 🇺🇸
- **Supabase**: Singapore (ap-southeast-1) 🇸🇬

### Network Latency Breakdown:
```
User Request:
  Sri Lanka → Virginia: ~170ms
  
Server Processing (104ms total):
  Vercel → Supabase (Singapore): ~50ms connection
  Database Query 1: ~30ms
  Database Query 2: ~30ms (parallel)
  Supabase → Vercel: ~50ms response
  
Response:
  Virginia → Sri Lanka: ~170ms

TOTAL: 170ms + 104ms + 170ms = 444ms minimum
```

This explains your **2-3 second** load times when cache is cold.

---

## ✅ Solution: Move Everything to Singapore

### Step 1: Deploy Vercel to Singapore (DONE)

I've created `vercel.json` in your project root:

```json
{
  "regions": ["sin1"]
}
```

**Deploy now:**

```bash
# Commit and push
git add vercel.json
git commit -m "Deploy to Singapore region (sin1) for Sri Lankan users"
git push

# Vercel will auto-deploy, or manually trigger:
vercel --prod
```

### Step 2: Verify Deployment Region

After deploying, check:

```bash
# Look for "sin1" in deployment logs
vercel logs --prod
```

Or test with:

```bash
curl -I https://vera.lk/listings | grep "x-vercel-id"
# Should show: sin1:: instead of iad1::
```

---

## Expected Performance Improvement

### Before (Current Setup):
```
User (Sri Lanka) → Virginia → Singapore → Virginia → Sri Lanka
170ms + 104ms (includes 2×50ms cross-region) + 170ms = 444ms
```

### After (Singapore Deployment):
```
User (Sri Lanka) → Singapore (Vercel + Supabase same region) → Sri Lanka
45ms + 20ms (local DB queries) + 45ms = 110ms
```

**Improvement: 444ms → 110ms = 75% faster! 🚀**

---

## Additional Optimizations

### 1. Enable Supabase Connection Pooling

Since you're in Singapore, enable pooling for even faster DB access:

```env
# .env.local
SUPABASE_POOLING_URL=postgresql://postgres.ahmynvxoxzhocuhxlcvo:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Savings**: 10-20ms per query

### 2. Combine Database Queries (Do This!)

Apply the migration I created earlier to combine the two queries into one:

```bash
# Apply the combined query migration
npx supabase db push
```

This reduces:
- 2 database round-trips → 1 round-trip
- ~40ms → ~20ms

### 3. Use CDN for Static Assets

Your static assets (JS, CSS, images) should be served from Cloudflare's Sri Lanka edge:

```bash
# Check if Cloudflare is serving from Sri Lanka
curl -I https://vera.lk/_next/static/chunks/main.js | grep "cf-ray"
# Look for: cf-ray: xxxxx-CMB (Colombo)
```

Already working! ✅ (Your HAR shows this is working)

---

## Network Latency Reference

### Typical Latencies from Sri Lanka:

| Route | Latency | Impact |
|-------|---------|--------|
| **Sri Lanka → Singapore** | **45-60ms** | ✅ **BEST** |
| Sri Lanka → Mumbai (India) | 50-70ms | ✅ Good |
| Sri Lanka → Sydney | 100-120ms | ⚠️ OK |
| **Sri Lanka → Virginia (US East)** | **170-200ms** | ❌ **BAD** |
| Sri Lanka → Europe | 200-250ms | ❌ Very Bad |

### Server-to-Server Latencies:

| Route | Latency | Impact |
|-------|---------|--------|
| **Singapore → Singapore** | **<1-5ms** | ✅ **BEST** |
| Singapore → Mumbai | 40-50ms | ⚠️ OK |
| **Singapore → Virginia** | **200-250ms** | ❌ **TERRIBLE** |

---

## Why Singapore for Sri Lanka?

1. **Geographic Proximity**: 2,800 km vs 15,000 km to Virginia
2. **Submarine Cable**: Direct undersea fiber between Colombo-Singapore
3. **Data Center Hub**: Singapore is Asia's primary cloud hub
4. **Supabase Location**: Your DB is already there
5. **Low Latency**: 45-60ms vs 170ms to US

**Sri Lanka → Singapore is THE optimal route for South Asian traffic.**

---

## Alternative: Multi-Region Setup (Advanced)

If you also have users in other regions:

### Vercel Edge Functions (Future)

```json
{
  "regions": ["sin1", "bom1"],
  "functions": {
    "app/listings/page.tsx": {
      "regions": ["sin1"]
    }
  }
}
```

- `sin1`: Singapore (Sri Lanka, Southeast Asia)
- `bom1`: Mumbai (India, South Asia)

### Supabase Read Replicas (Pro Plan)

1. Keep primary in Singapore (writes)
2. Add read replica in Singapore (reads)
3. Route read-heavy pages to replica

**Cost**: $400/month (Pro plan + replica)

---

## Testing the Fix

### Before Deployment:
```bash
# Test from Sri Lanka or use VPN
time curl -I https://vera.lk/listings
# Should show: ~2-3 seconds
```

### After Deployment:
```bash
time curl -I https://vera.lk/listings
# Should show: ~300-500ms (4-6x faster!)
```

### Network Path Verification:

```bash
# Check server region
curl -I https://vera.lk/listings | grep "x-vercel-id"
# Before: iad1::iad1::xxxxx (Virginia)
# After:  sin1::sin1::xxxxx (Singapore)

# Check Cloudflare edge
curl -I https://vera.lk/listings | grep "cf-ray"
# Should show: CMB (Colombo) or SIN (Singapore)
```

---

## Rollback Plan

If something breaks:

```bash
# Remove vercel.json
git rm vercel.json
git commit -m "Rollback to global deployment"
git push

# Or change to multiple regions
{
  "regions": ["sin1", "iad1"]
}
```

---

## Cost Impact

**Good news**: Singapore deployment costs the **same** as US deployment on Vercel.

No additional cost! 💰✅

---

## Summary

### What Changed:
1. ✅ Created `vercel.json` to deploy to Singapore
2. ✅ Documented the geographic latency problem
3. ✅ Provided deployment and testing instructions

### What You Need to Do:
1. **Commit and deploy** the `vercel.json` file
2. **Wait** 2-3 minutes for deployment
3. **Test** from Sri Lanka
4. **Monitor** performance improvement

### Expected Results:
- **Before**: 2-3 seconds (with cache miss)
- **After**: 300-500ms (with cache miss)
- **Improvement**: **75-85% faster** 🚀

---

## Questions?

**Q: Will this affect users in other countries?**
A: If you have significant traffic from US/Europe, use multi-region. Otherwise, Singapore serves South Asia, Southeast Asia, and Australia well.

**Q: What about Cloudflare?**
A: Cloudflare edge caching already works! It serves static assets from local edge locations (Colombo, Mumbai, etc.)

**Q: Do I need to change DNS?**
A: No! Vercel automatically routes traffic to the correct region.

**Q: What about database queries?**
A: Supabase is already in Singapore. By moving Vercel to Singapore, your app and database are co-located = **<5ms latency** instead of 200ms!

---

## Next Steps

```bash
# 1. Commit the change
git add vercel.json docs/performance/GEOGRAPHIC_LATENCY_FIX.md
git commit -m "Deploy to Singapore region for Sri Lankan users"

# 2. Push to production
git push

# 3. Verify deployment (after 2-3 minutes)
curl -I https://vera.lk/listings | grep "x-vercel-id"

# 4. Test speed
time curl -o /dev/null -s -w '%{time_total}\n' https://vera.lk/listings

# 5. Celebrate! 🎉
```

Your `/listings` page should now load in **300-500ms** instead of 2-3 seconds!


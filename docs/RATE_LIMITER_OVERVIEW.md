# Rate Limiter Overview

## 📋 Table of Contents
1. [How Rate Limiting Works](#how-rate-limiting-works)
2. [Rate Limiter Architecture](#rate-limiter-architecture)
3. [All Rate Limiter Configurations](#all-rate-limiter-configurations)
4. [Where Rate Limiting is Applied](#where-rate-limiting-is-applied)
5. [Identifier Logic](#identifier-logic)
6. [Quarantine System](#quarantine-system)
7. [Distributed Rate Limiting (Upstash Redis)](#distributed-rate-limiting-upstash-redis)

---

## How Rate Limiting Works

### Core Algorithm: Sliding Window

The rate limiter uses a **sliding window** algorithm with the following logic:

1. **Identifier Creation**: Each request is identified by `IP + User Token` (or just IP for anonymous users)
2. **Timestamp Tracking**: For each identifier, the system maintains an array of timestamps representing when requests were made
3. **Window Calculation**: 
   - Current time: `now = Date.now()`
   - Window start: `windowStart = now - interval`
   - Only timestamps within the window are considered valid
4. **Limit Check**: 
   - If `validTimestamps.length >= maxRequests` → **BLOCK** (return 429)
   - Otherwise → **ALLOW** (add current timestamp and proceed)
5. **Cleanup**: Old timestamps outside the window are automatically filtered out

### Example Flow

```
Time: 10:00:00 - Request 1 → ✅ Allowed (timestamps: [10:00:00])
Time: 10:00:15 - Request 2 → ✅ Allowed (timestamps: [10:00:00, 10:00:15])
Time: 10:00:30 - Request 3 → ✅ Allowed (timestamps: [10:00:00, 10:00:15, 10:00:30])
Time: 10:01:01 - Request 4 → ✅ Allowed (10:00:00 expired, timestamps: [10:00:15, 10:00:30, 10:01:01])
Time: 10:00:45 - Request 5 → ❌ BLOCKED (limit of 3 exceeded)
```

---

## Rate Limiter Architecture

### Storage Backend

The system supports **two storage backends**:

1. **In-Memory (Default)**: Uses `LRUCache` with:
   - Max 5,000 entries per limiter type
   - 1-hour TTL for cache entries
   - Fast but not shared across instances

2. **Upstash Redis (Optional)**: 
   - Enabled via `USE_UPSTASH=true`
   - Uses fixed-window algorithm
   - Shared across all server instances
   - Automatically falls back to in-memory if Redis fails

### Key Functions

- `rateLimit(config, name)`: Creates a rate limiter function
- `withRateLimit(request, limiter)`: Wrapper that applies rate limiting and returns 429 response if exceeded
- `getIdentifier(request)`: Extracts IP + user token to create unique identifier
- `rateLimitByIP(config)`: IP-only rate limiting (for public endpoints)

---

## All Rate Limiter Configurations

Located in `lib/middleware/rateLimiter.ts`:

| Limiter | Interval | Max Requests | Use Case |
|---------|-----------|--------------|----------|
| **api** | 1 minute | 100 | General API endpoints (default) |
| **auth** | 15 minutes | 5 | Authentication endpoints (login, signup, OTP) |
| **search** | 1 minute | 30 | Search endpoints |
| **upload** | 1 minute | 15 | File upload endpoints (supports 10 concurrent uploads) |
| **messaging** | 1 minute | 20 | Messaging endpoints |
| **ai** | 1 minute | 10 (configurable) | AI-powered endpoints |
| **aiDaily** | 24 hours | 100 (configurable) | Daily cap for AI endpoints |
| **admin** | 1 minute | 50 | Admin-only endpoints |
| **strict** | 15 minutes | 20 | Sensitive operations (delete operations - allows power users to manage multiple listings) |

### Environment Variables

- `AI_RATE_LIMIT_PER_MINUTE`: Override AI rate limit (default: 10)
- `AI_DAILY_LIMIT`: Override AI daily limit (default: 100)
- `USE_UPSTASH`: Enable Redis-backed rate limiting (`true`/`false`)
- `UPSTASH_REDIS_REST_URL`: Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis REST token

---

## Where Rate Limiting is Applied

### 1. **Global Middleware** (`middleware.ts`)

**Location**: Applied to ALL `/api/*` routes automatically

**Logic**:
```typescript
if (pathname.startsWith('/api/auth')) → rateLimiters.auth
else if (pathname.startsWith('/api/search')) → rateLimiters.search
else if (pathname.startsWith('/api/upload')) → rateLimiters.upload
else if (pathname.startsWith('/api/messages') || '/api/messaging') → rateLimiters.messaging
else if (pathname.startsWith('/api/ai-') || '/api/generate-ai') → rateLimiters.ai + aiDaily
else if (pathname.startsWith('/api/admin')) → rateLimiters.admin
else if (pathname.includes('/delete')) → rateLimiters.strict
else → rateLimiters.api (default)
```

**Routes Covered**:
- ✅ `/api/auth/*` - Auth endpoints
- ✅ `/api/search/*` - Search endpoints  
- ✅ `/api/upload/*` - Upload endpoints
- ✅ `/api/messages/*` - Messaging endpoints
- ✅ `/api/ai-*` - AI endpoints (dual limits)
- ✅ `/api/admin/*` - Admin endpoints
- ✅ `/api/*/delete*` - Delete operations
- ✅ `/api/*` - All other API routes (default)

### 2. **Explicit Route-Level Rate Limiting**

Some routes apply rate limiting **explicitly** in addition to middleware:

#### `app/api/wanted-requests/route.ts`
- **Limiter**: `rateLimiters.auth` (5 per 15 minutes)
- **Why**: Additional protection for wanted request creation

#### `app/api/admin/listings/approve/route.ts`
- **Limiter**: `rateLimiters.admin` (50 per minute)
- **Why**: Admin actions need explicit rate limiting

#### `app/api/admin/wanted-requests/approve/route.ts`
- **Limiter**: `rateLimiters.admin` (50 per minute)
- **Why**: Admin actions need explicit rate limiting

### 3. **Security Middleware** (`lib/security/security-middleware.ts`)

**Function**: `securityMiddleware()`

**Usage**: Used by endpoints that need comprehensive security:
- Rate limiting
- IP quarantine checks
- Payload size validation
- reCAPTCHA verification

**Example Usage**:
```typescript
const securityCheck = await securityMiddleware(request, {
  endpoint: '/api/upload',
  rateLimit: 'upload',
  requireAuth: true,
  requireCaptcha: true
})
```

**Routes Using Security Middleware**:
- `/api/admin/security` - Security metrics endpoint
- Upload endpoints (via security middleware)

---

## Identifier Logic

### How Requests are Identified

The rate limiter creates a unique identifier for each request:

```typescript
identifier = `${ip}-${userPart}`
```

**IP Extraction** (in order of priority):
1. `x-forwarded-for` header (first IP if multiple)
2. `x-real-ip` header
3. `request.ip` (platform-dependent)
4. `'unknown'` (fallback)

**User Part**:
- If authenticated: `user-${authToken.substring(0, 16)}` (first 16 chars of Bearer token)
- If anonymous: `anonymous`

### Example Identifiers

```
192.168.1.1-user-abc123def4567890  (authenticated user)
192.168.1.1-anonymous               (anonymous user)
unknown-anonymous                   (no IP detected)
```

### Why This Matters

- **Same IP + Same User** = Same rate limit bucket
- **Same IP + Different Users** = Different rate limit buckets
- **Different IPs** = Always different buckets

This prevents:
- ✅ One user from exhausting another user's quota
- ✅ IP-based attacks from affecting authenticated users differently
- ✅ Anonymous users from sharing rate limits

---

## Quarantine System

### Overview

The quarantine system provides **temporary IP blocking** for repeat offenders.

### How It Works

1. **Strike Registration**: When a rate limit is exceeded, a "strike" is recorded for that IP
2. **Threshold Check**: If an IP accumulates `QUARANTINE_THRESHOLD` strikes within `QUARANTINE_WINDOW_SECONDS`, it gets blocked
3. **Block Duration**: Blocked IPs are blocked for `QUARANTINE_BAN_SECONDS`
4. **Automatic Unblock**: After the ban duration expires, the IP is automatically unblocked

### Configuration

Environment variables:
- `QUARANTINE_ENABLED`: Enable/disable quarantine (`true`/`false`)
- `QUARANTINE_THRESHOLD`: Number of violations to trigger ban (default: 5)
- `QUARANTINE_WINDOW_SECONDS`: Time window for counting violations (default: 120 seconds)
- `QUARANTINE_BAN_SECONDS`: Ban duration (default: 600 seconds = 10 minutes)

### Example Flow

```
10:00:00 - IP 1.2.3.4 exceeds rate limit → Strike 1
10:00:30 - IP 1.2.3.4 exceeds rate limit → Strike 2
10:01:00 - IP 1.2.3.4 exceeds rate limit → Strike 3
10:01:30 - IP 1.2.3.4 exceeds rate limit → Strike 4
10:02:00 - IP 1.2.3.4 exceeds rate limit → Strike 5 → 🚫 BLOCKED for 10 minutes
10:02:01 - IP 1.2.3.4 makes request → ❌ 403 Forbidden (quarantined)
10:12:01 - IP 1.2.3.4 makes request → ✅ Allowed (ban expired)
```

### Storage

- **In-Memory**: Uses LRUCache (max 20,000 entries)
- **Redis**: If Upstash is enabled, uses Redis for distributed tracking

---

## Distributed Rate Limiting (Upstash Redis)

### When to Use

Enable Redis-backed rate limiting when:
- Running multiple server instances
- Need consistent rate limits across instances
- Want persistent rate limit tracking

### Setup

1. Set environment variables:
   ```bash
   USE_UPSTASH=true
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

2. The system automatically:
   - Detects Redis availability
   - Uses Redis for rate limiting if available
   - Falls back to in-memory if Redis fails

### Algorithm Difference

- **In-Memory**: Sliding window (tracks all timestamps)
- **Redis**: Fixed window (uses Upstash's fixed window algorithm)

### Benefits

- ✅ Shared state across all server instances
- ✅ Survives server restarts
- ✅ Better for high-traffic applications
- ✅ Automatic fallback if Redis is unavailable

---

## Response Format

When rate limit is exceeded, the system returns:

**Status Code**: `429 Too Many Requests`

**Headers**:
```
X-RateLimit-Limit: 15
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
Retry-After: 45
```

**Body**:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again after 2024-01-01T12:00:00.000Z",
  "limit": 15,
  "remaining": 0,
  "reset": "2024-01-01T12:00:00.000Z"
}
```

---

## Monitoring & Metrics

The rate limiter tracks metrics via `incr()`:

- `ratelimit.hit.{name}` - Successful rate limit check
- `ratelimit.block.{name}` - Rate limit exceeded
- `ratelimit.response429.{name}` - 429 response sent

### Admin Endpoints

- `/api/admin/security-metrics` - View quarantine stats and top offenders
- `getTopOffenders()` - Get IPs and paths with most violations

---

## Summary

### Rate Limiting Flow

```
Request → Middleware → Identify Request (IP + User)
                    ↓
            Check Quarantine (if enabled)
                    ↓
            Select Rate Limiter (by path)
                    ↓
            Check Rate Limit (sliding window)
                    ↓
        ┌───────────┴───────────┐
        │                      │
    ✅ Allowed            ❌ Exceeded
        │                      │
        │                  Record Strike
        │                      │
        │              Check Quarantine Threshold
        │                      │
        │                  ┌────┴────┐
        │                  │         │
        │              Block IP   Return 429
        │                  │         │
        │              Return 403    │
        │                            │
        └─────────── Continue ───────┘
```

### Key Takeaways

1. **Automatic**: All `/api/*` routes are rate-limited via middleware
2. **Configurable**: Each endpoint type has its own limits
3. **Dual Protection**: Some routes have both middleware + explicit rate limiting
4. **Smart Identification**: Uses IP + User token for accurate tracking
5. **Quarantine**: Repeat offenders get temporarily blocked
6. **Distributed**: Supports Redis for multi-instance deployments
7. **Resilient**: Falls back gracefully if Redis is unavailable


# Redis Migration Plan: Caching, Rate Limiting & Session Management

## Executive Summary

This document outlines a comprehensive plan to migrate caching, rate limiting, and session management from in-memory/database-based storage to Redis. The migration will improve scalability, reliability, and performance across multiple server instances.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Migration Goals](#migration-goals)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [Technical Specifications](#technical-specifications)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)
8. [Monitoring & Observability](#monitoring--observability)
9. [Cost Analysis](#cost-analysis)
10. [Timeline](#timeline)

---

## 1. Current State Analysis

### 1.1 Rate Limiting
**Current Implementation:**
- **File:** `lib/middleware/rateLimiter.ts`
- **Storage:** In-memory LRUCache with optional Upstash Redis fallback
- **Mechanisms:**
  - LRUCache with 1-hour TTL
  - Optional Upstash Redis integration (partially implemented)
  - 11 different rate limiter types (api, auth, otp, search, upload, messaging, ai, aiDaily, admin, strict, report, contact)
  - IP quarantine system (in-memory)
  - Strikes/blocking cache (in-memory)

**Issues:**
- ❌ Not distributed across instances (each server has its own cache)
- ❌ Data lost on server restart
- ❌ Inconsistent limits across instances during load balancing
- ❌ Memory leaks from unbounded caches
- ⚠️ Partial Redis support (not fully utilized)

### 1.2 Caching
**Current Implementation:**
- **Files:**
  - `lib/services/guideCache.ts` (buying guides - Supabase database)
  - `app/api/generate-ai-guide/route-optimized.ts` (in-memory Map)
- **Storage:** 
  - Database-based (`buying_guides_cache` table)
  - In-memory Maps for AI guides
  - No centralized cache invalidation
- **TTL:** 30 days for buying guides, 1 hour for AI guides

**Issues:**
- ❌ Database queries for cache lookups (slow)
- ❌ No cache warming strategy
- ❌ No distributed cache sharing
- ❌ Cache invalidation is manual
- ❌ No cache hit/miss metrics

### 1.3 Session Management
**Current Implementation:**
- **Files:**
  - `app/api/auth/sessions/route.ts`
  - `supabase/migrations/006_session_management.sql`
- **Storage:** 
  - Supabase `user_sessions` table (PostgreSQL)
  - Session activity in `session_activity` table
  - Supabase Auth handles primary session tokens (cookies)
- **Features:**
  - Session tracking (device, IP, location)
  - Session revocation
  - Activity logging

**Issues:**
- ❌ Database queries for every session check (latency)
- ❌ No session caching layer
- ❌ Expensive queries for active session lists
- ❌ No real-time session invalidation
- ❌ Limited scalability for high concurrent users

### 1.4 Metrics & Monitoring
**Current Implementation:**
- **File:** `lib/security/metrics.ts`
- **Storage:**
  - In-memory counters
  - Optional Upstash write-through
  - Daily aggregation
- **Issues:**
  - ❌ Metrics lost on restart
  - ❌ Not distributed across instances
  - ❌ Limited historical data

---

## 2. Migration Goals

### 2.1 Primary Goals
1. **Distributed Systems:** Support multiple server instances with shared state
2. **Performance:** Reduce latency for rate limiting and cache lookups (<10ms p99)
3. **Reliability:** Persistent storage that survives server restarts
4. **Scalability:** Handle 10x traffic growth without degradation
5. **Cost Efficiency:** Optimize Redis usage to minimize costs

### 2.2 Success Metrics
- ✅ Rate limit checks: <5ms p99 (currently ~1-2ms in-memory, acceptable trade-off)
- ✅ Cache hit rate: >80% for buying guides
- ✅ Session lookup: <10ms p99 (currently ~50-100ms database)
- ✅ Zero data loss during deployments
- ✅ 99.9% uptime for Redis operations
- ✅ Cost increase <$50/month for Redis hosting

---

## 3. Architecture Overview

### 3.1 Redis Infrastructure

**Option A: Upstash Redis (Recommended)**
- ✅ Serverless, auto-scaling
- ✅ REST API (no connection pooling needed)
- ✅ Free tier available (10K commands/day)
- ✅ Global edge locations
- ✅ Built-in rate limiting library
- ⚠️ Cost: ~$0.20 per 100K commands

**Option B: Vercel KV (Redis)**
- ✅ Native Vercel integration
- ✅ Simple setup
- ⚠️ Limited to Vercel deployments
- ⚠️ Similar pricing to Upstash

**Option C: Self-hosted Redis (Railway/Fly.io)**
- ✅ Full control
- ✅ Lower cost at scale
- ❌ More operational overhead
- ❌ Requires connection management

**Recommendation: Upstash Redis** for simplicity, reliability, and cost-effectiveness.

### 3.2 Redis Key Structure

```
# Rate Limiting
rl:{limiter_type}:{identifier}              # Rate limit counter (TTL: window duration)
q:block:{ip}                                # IP quarantine (TTL: ban duration)
q:strikes:{ip}                              # Strike counter (TTL: 5 min)
q:violations:{ip}                           # Violation count (TTL: 1 hour)

# Caching
cache:guide:{cache_key}                     # Buying guide (TTL: 30 days)
cache:ai-guide:{query_hash}                 # AI guide (TTL: 1 hour)
cache:listing:{id}                          # Listing cache (TTL: 1 hour)
cache:profile:{id}                          # Profile cache (TTL: 15 min)
cache:search:{query_hash}                   # Search results (TTL: 5 min)

# Sessions
session:{session_token}                     # Session data (TTL: 30 days)
session:user:{user_id}                      # Set of active session tokens
session:ip:{ip}:{user_id}                   # IP-based session tracking
session:activity:{session_id}               # Session activity log (TTL: 7 days)

# Metrics
metrics:{name}:d:{YYYYMMDD}                 # Daily counter (TTL: 3 days)
metrics:{name}:m:{YYYYMMDDHHmm}             # Minute trend (TTL: 2 days)
metrics:keys:d:{YYYYMMDD}                   # Set of metric keys (TTL: 3 days)
admin:audit:d:{YYYYMMDD}                    # Admin audit log (TTL: 3 days)
```

### 3.3 Redis Data Structures

| Use Case | Structure | Reason |
|----------|-----------|--------|
| Rate Limiting | String (counter) + TTL | Simple, atomic increments |
| IP Quarantine | String (timestamp) + TTL | Quick existence check |
| Caching | String (JSON) + TTL | Fast serialization |
| Active Sessions | Set | O(1) membership checks |
| Session Data | Hash | Efficient field access |
| Metrics | String (counter) | Atomic operations |
| Audit Logs | List | Ordered, easy truncation |

### 3.4 Fallback Strategy

**Multi-Layer Fallback:**
1. **Primary:** Redis (Upstash)
2. **Secondary:** In-memory cache (LRUCache) with TTL
3. **Tertiary:** Database queries (for critical operations)

**Circuit Breaker Pattern:**
- Monitor Redis health
- If Redis unavailable for >30s, switch to in-memory
- If in-memory unavailable, allow operations with warnings
- Auto-recover when Redis becomes available

---

## 4. Implementation Phases

### Phase 1: Foundation & Infrastructure (Week 1-2)

#### 1.1 Redis Setup & Configuration
- [ ] Set up Upstash Redis instance
- [ ] Configure environment variables
- [ ] Create Redis client wrapper with connection pooling
- [ ] Implement health checks and monitoring
- [ ] Set up Redis CLI tools for debugging
- [ ] Document connection string and credentials

#### 1.2 Core Redis Utilities
- [ ] Create `lib/redis/client.ts` (singleton Redis client)
- [ ] Create `lib/redis/health.ts` (health checks)
- [ ] Create `lib/redis/types.ts` (TypeScript types)
- [ ] Implement circuit breaker pattern
- [ ] Add retry logic with exponential backoff
- [ ] Create Redis connection testing script

**Deliverables:**
- Working Redis connection
- Health check endpoint: `/api/health/redis`
- Redis monitoring dashboard

---

### Phase 2: Rate Limiting Migration (Week 3-4)

#### 2.1 Migrate Rate Limiter Core
- [ ] Update `lib/middleware/rateLimiter.ts` to use Redis primary
- [ ] Implement sliding window algorithm in Redis
- [ ] Migrate all 11 rate limiter types
- [ ] Add Redis-backed IP quarantine
- [ ] Implement strike counter in Redis
- [ ] Migrate violation tracking

#### 2.2 Enhance Rate Limiting
- [ ] Add per-user rate limits (in addition to IP)
- [ ] Implement rate limit analytics in Redis
- [ ] Create rate limit dashboard/API
- [ ] Add rate limit reset utilities
- [ ] Implement graceful degradation

**Files to Update:**
- `lib/middleware/rateLimiter.ts`
- `lib/security/redis-rate-limiter.ts` (enhance existing)
- `scripts/reset-rate-limits.js` (update for Redis)

**Testing:**
- [ ] Unit tests for Redis rate limiting
- [ ] Load tests (1000 requests/second)
- [ ] Failover tests (Redis down scenario)
- [ ] Cross-instance consistency tests

**Deliverables:**
- All rate limiters using Redis
- Zero-downtime migration
- Monitoring dashboard

---

### Phase 3: Caching Migration (Week 5-6)

#### 3.1 Buying Guides Cache
- [ ] Migrate `lib/services/guideCache.ts` to Redis
- [ ] Keep database as backup/write-through
- [ ] Implement cache warming for popular guides
- [ ] Add cache invalidation triggers
- [ ] Create cache analytics

#### 3.2 AI Guides Cache
- [ ] Migrate in-memory AI guide cache to Redis
- [ ] Implement query-based cache keys
- [ ] Add cache size limits
- [ ] Create cache eviction policy (LRU)

#### 3.3 Additional Caches
- [ ] Listing detail cache (popular listings)
- [ ] Search results cache (frequent queries)
- [ ] Profile cache (reduce database load)
- [ ] Static data cache (locations, categories)

**Files to Update:**
- `lib/services/guideCache.ts`
- `app/api/generate-ai-guide/route.ts`
- `app/api/listings/[id]/route.ts` (add caching)
- `app/api/search/route.ts` (add caching)

**Cache Strategy:**
```typescript
// Write-through: Write to both Redis and DB
async function cacheGuide(key: string, data: Guide) {
  await redis.setex(`cache:guide:${key}`, 2592000, JSON.stringify(data))
  await db.upsert('buying_guides_cache', data) // Backup in DB
}

// Cache-aside: Read from Redis, fallback to DB
async function getGuide(key: string): Promise<Guide | null> {
  // Try Redis first
  const cached = await redis.get(`cache:guide:${key}`)
  if (cached) return JSON.parse(cached)
  
  // Fallback to DB
  const guide = await db.getGuide(key)
  if (guide) {
    await redis.setex(`cache:guide:${key}`, 2592000, JSON.stringify(guide))
  }
  return guide
}
```

**Testing:**
- [ ] Cache hit/miss ratio tests
- [ ] Cache invalidation tests
- [ ] Cache warming tests
- [ ] Load tests with cache

**Deliverables:**
- All caches migrated to Redis
- Cache hit rate >80%
- Cache invalidation working

---

### Phase 4: Session Management Migration (Week 7-8)

#### 4.1 Session Storage in Redis
- [ ] Create Redis-backed session store
- [ ] Migrate active session tracking to Redis
- [ ] Implement session lookup caching
- [ ] Add session refresh mechanism
- [ ] Implement distributed session revocation

#### 4.2 Session Features
- [ ] Real-time session invalidation (pub/sub)
- [ ] Session activity streaming
- [ ] Concurrent session limit per user
- [ ] Suspicious activity detection
- [ ] Geographic session tracking

**Architecture:**
```typescript
// Session Storage
session:{token} = {
  userId: string
  deviceInfo: object
  ipAddress: string
  createdAt: timestamp
  lastActivity: timestamp
  expiresAt: timestamp
}

// Active Sessions Set
session:user:{userId} = Set<session_token> // All active sessions for user

// Session Lookup (with caching)
async function getSession(token: string) {
  // Check Redis first
  const session = await redis.get(`session:${token}`)
  if (session) return JSON.parse(session)
  
  // Fallback to DB
  const dbSession = await db.getSession(token)
  if (dbSession) {
    await redis.setex(`session:${token}`, 2592000, JSON.stringify(dbSession))
    await redis.sadd(`session:user:${dbSession.userId}`, token)
  }
  return dbSession
}
```

**Files to Update:**
- `app/api/auth/sessions/route.ts`
- `lib/auth.ts` (add session caching)
- `app/contexts/AuthContext.tsx` (optional client-side cache)

**Testing:**
- [ ] Session creation/retrieval tests
- [ ] Concurrent session tests
- [ ] Session revocation tests
- [ ] Session expiration tests
- [ ] Cross-instance session access

**Deliverables:**
- Redis-backed session management
- <10ms session lookups
- Real-time session invalidation

---

### Phase 5: Metrics & Monitoring (Week 9-10)

#### 5.1 Metrics Migration
- [ ] Migrate `lib/security/metrics.ts` to Redis
- [ ] Implement distributed counters
- [ ] Add time-series metrics storage
- [ ] Create metrics aggregation pipeline
- [ ] Build metrics dashboard

#### 5.2 Enhanced Monitoring
- [ ] Redis performance metrics
- [ ] Cache hit/miss ratios
- [ ] Rate limit violation tracking
- [ ] Session activity analytics
- [ ] Cost tracking (Redis command usage)

**Files to Update:**
- `lib/security/metrics.ts`
- `lib/monitoring/security-monitoring.ts`
- `app/api/admin/metrics/route.ts`

**Deliverables:**
- Distributed metrics system
- Real-time monitoring dashboard
- Historical metrics (7 days)

---

### Phase 6: Cleanup & Optimization (Week 11-12)

#### 6.1 Code Cleanup
- [ ] Remove in-memory fallbacks (keep for emergency)
- [ ] Consolidate duplicate rate limiting code
- [ ] Remove unused database cache tables (after migration period)
- [ ] Update documentation

#### 6.2 Performance Optimization
- [ ] Optimize Redis key patterns
- [ ] Implement connection pooling
- [ ] Add Redis pipelining for batch operations
- [ ] Optimize TTL strategies
- [ ] Implement cache warming strategies

#### 6.3 Cost Optimization
- [ ] Analyze Redis command usage
- [ ] Optimize expensive operations
- [ ] Implement cache size limits
- [ ] Add automatic cleanup jobs
- [ ] Set up cost alerts

**Deliverables:**
- Cleaned codebase
- Optimized Redis usage
- Cost under budget

---

## 5. Technical Specifications

### 5.1 Redis Client Implementation

```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/utils/logger'

class RedisClient {
  private client: Redis | null = null
  private healthStatus: 'healthy' | 'degraded' | 'down' = 'down'
  private lastHealthCheck: number = 0
  private fallbackEnabled: boolean = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      logger.warn('Redis not configured, using in-memory fallback')
      this.fallbackEnabled = true
      return
    }

    try {
      this.client = new Redis({ url, token })
      await this.healthCheck()
    } catch (error) {
      logger.error('Redis initialization failed', error as Error)
      this.fallbackEnabled = true
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) return false

    try {
      await this.client.ping()
      this.healthStatus = 'healthy'
      this.lastHealthCheck = Date.now()
      return true
    } catch (error) {
      this.healthStatus = 'down'
      logger.error('Redis health check failed', error as Error)
      return false
    }
  }

  getClient(): Redis | null {
    if (this.healthStatus === 'down' && Date.now() - this.lastHealthCheck > 30000) {
      this.healthCheck() // Re-check every 30s
    }
    return this.client
  }

  isHealthy(): boolean {
    return this.healthStatus === 'healthy'
  }

  // Wrapper methods with fallback
  async get<T>(key: string): Promise<T | null> {
    const client = this.getClient()
    if (!client) return null

    try {
      const value = await client.get(key)
      return value as T | null
    } catch (error) {
      logger.error('Redis GET error', error as Error, { key })
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    const client = this.getClient()
    if (!client) return false

    try {
      if (ttl) {
        await client.setex(key, ttl, value)
      } else {
        await client.set(key, value)
      }
      return true
    } catch (error) {
      logger.error('Redis SET error', error as Error, { key })
      return false
    }
  }

  async incr(key: string, ttl?: number): Promise<number> {
    const client = this.getClient()
    if (!client) return 0

    try {
      const value = await client.incr(key)
      if (ttl && value === 1) {
        await client.expire(key, ttl)
      }
      return value
    } catch (error) {
      logger.error('Redis INCR error', error as Error, { key })
      return 0
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const client = this.getClient()
    if (!client) return 0

    try {
      return await client.sadd(key, ...members)
    } catch (error) {
      logger.error('Redis SADD error', error as Error, { key })
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    const client = this.getClient()
    if (!client) return []

    try {
      return await client.smembers(key) || []
    } catch (error) {
      logger.error('Redis SMEMBERS error', error as Error, { key })
      return []
    }
  }

  async del(...keys: string[]): Promise<number> {
    const client = this.getClient()
    if (!client) return 0

    try {
      return await client.del(...keys)
    } catch (error) {
      logger.error('Redis DEL error', error as Error, { keys })
      return 0
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const client = this.getClient()
    if (!client) return false

    try {
      await client.expire(key, seconds)
      return true
    } catch (error) {
      logger.error('Redis EXPIRE error', error as Error, { key })
      return false
    }
  }
}

export const redis = new RedisClient()
```

### 5.2 Rate Limiting Implementation

```typescript
// lib/redis/rateLimiter.ts
import { redis } from './client'
import { Ratelimit } from '@upstash/ratelimit'

export interface RateLimitConfig {
  interval: number // milliseconds
  maxRequests: number
  algorithm?: 'fixed-window' | 'sliding-window' | 'token-bucket'
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  limiterName: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: Date
}> {
  const redisClient = redis.getClient()
  
  if (!redisClient) {
    // Fallback to in-memory
    return fallbackRateLimit(identifier, config)
  }

  try {
    // Use Upstash Ratelimit library
    const limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.interval}ms`),
      analytics: true,
      prefix: `rl:${limiterName}`,
    })

    const result = await limiter.limit(identifier)
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    }
  } catch (error) {
    logger.error('Redis rate limit error', error as Error)
    return fallbackRateLimit(identifier, config)
  }
}
```

### 5.3 Caching Implementation

```typescript
// lib/redis/cache.ts
import { redis } from './client'

export interface CacheOptions {
  ttl: number // seconds
  tags?: string[] // for invalidation
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const value = await redis.get<string>(`cache:${key}`)
  if (!value) return null
  
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions
): Promise<boolean> {
  const serialized = JSON.stringify(value)
  const success = await redis.set(`cache:${key}`, serialized, options.ttl)
  
  // Store tags for invalidation
  if (options.tags && success) {
    for (const tag of options.tags) {
      await redis.sadd(`cache:tag:${tag}`, key)
      await redis.expire(`cache:tag:${tag}`, options.ttl)
    }
  }
  
  return success
}

export async function cacheInvalidate(tag: string): Promise<number> {
  const keys = await redis.smembers(`cache:tag:${tag}`)
  if (keys.length === 0) return 0
  
  const deleted = await redis.del(...keys.map(k => `cache:${k}`))
  await redis.del(`cache:tag:${tag}`)
  
  return deleted
}
```

### 5.4 Session Management Implementation

```typescript
// lib/redis/sessions.ts
import { redis } from './client'

export interface SessionData {
  userId: string
  deviceInfo: Record<string, any>
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActivity: string
  expiresAt: string
}

export async function getSession(token: string): Promise<SessionData | null> {
  const session = await redis.get<SessionData>(`session:${token}`)
  if (session) {
    // Update last activity
    session.lastActivity = new Date().toISOString()
    await redis.set(`session:${token}`, JSON.stringify(session), 2592000) // 30 days
  }
  return session
}

export async function createSession(
  token: string,
  data: SessionData,
  ttl: number = 2592000 // 30 days
): Promise<boolean> {
  // Store session data
  const success = await redis.set(`session:${token}`, JSON.stringify(data), ttl)
  
  if (success) {
    // Add to user's active sessions set
    await redis.sadd(`session:user:${data.userId}`, token)
    await redis.expire(`session:user:${data.userId}`, ttl)
    
    // Track IP-based sessions
    await redis.sadd(`session:ip:${data.ipAddress}:${data.userId}`, token)
    await redis.expire(`session:ip:${data.ipAddress}:${data.userId}`, ttl)
  }
  
  return success
}

export async function revokeSession(
  token: string,
  userId: string
): Promise<boolean> {
  // Get session to get IP
  const session = await getSession(token)
  
  // Delete session
  await redis.del(`session:${token}`)
  
  // Remove from user's active sessions
  await redis.srem(`session:user:${userId}`, token)
  
  // Remove from IP tracking
  if (session?.ipAddress) {
    await redis.srem(`session:ip:${session.ipAddress}:${userId}`, token)
  }
  
  return true
}

export async function getUserSessions(userId: string): Promise<string[]> {
  return await redis.smembers(`session:user:${userId}`)
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests
- [ ] Redis client wrapper tests
- [ ] Rate limiting algorithm tests
- [ ] Cache get/set/invalidate tests
- [ ] Session management tests
- [ ] Fallback mechanism tests
- [ ] Circuit breaker tests

### 6.2 Integration Tests
- [ ] End-to-end rate limiting flow
- [ ] Cache hit/miss scenarios
- [ ] Session creation/retrieval/revocation
- [ ] Cross-instance consistency
- [ ] Redis failover scenarios

### 6.3 Load Tests
- [ ] Rate limiting: 1000 req/s per endpoint
- [ ] Cache: 5000 operations/second
- [ ] Sessions: 10000 concurrent users
- [ ] Redis connection pool limits
- [ ] Memory usage under load

### 6.4 Failover Tests
- [ ] Redis unavailable → in-memory fallback
- [ ] Redis slow → timeout handling
- [ ] Partial Redis failures
- [ ] Recovery after Redis restoration

### 6.5 Consistency Tests
- [ ] Multiple instances see same rate limits
- [ ] Cache invalidation propagates across instances
- [ ] Session revocation works across instances

---

## 7. Rollback Plan

### 7.1 Rollback Triggers
- Redis downtime >5 minutes
- Error rate >1% for Redis operations
- Performance degradation >50%
- Data corruption detected
- Cost exceeds budget by >50%

### 7.2 Rollback Procedure

**Immediate Rollback (< 5 minutes):**
1. Set `USE_REDIS=false` environment variable
2. Redeploy application
3. System automatically falls back to in-memory

**Data Recovery:**
- Rate limits: Reset (acceptable - temporary)
- Cache: Rebuild from database
- Sessions: Already in database (no data loss)
- Metrics: Lost during rollback period (acceptable)

**Gradual Rollback:**
1. Reduce Redis usage to 50% (feature flag)
2. Monitor for 24 hours
3. If stable, reduce to 0%
4. Revert code changes in next deployment

### 7.3 Rollback Communication
- Notify team immediately
- Update status page
- Document root cause
- Create post-mortem

---

## 8. Monitoring & Observability

### 8.1 Metrics to Track

**Redis Performance:**
- Command latency (p50, p95, p99)
- Error rate
- Connection pool usage
- Memory usage
- Command throughput

**Rate Limiting:**
- Requests allowed/denied per limiter
- Violation rate by identifier
- Quarantine count
- Cross-instance consistency

**Caching:**
- Hit/miss ratio per cache type
- Cache size (keys, memory)
- Eviction rate
- Warming success rate

**Sessions:**
- Active session count
- Session creation/revocation rate
- Average session duration
- Concurrent sessions per user

### 8.2 Alerts

**Critical (PagerDuty):**
- Redis unavailable >30s
- Error rate >5%
- Cache hit rate <50%
- Session lookup latency >100ms

**Warning (Email/Slack):**
- Redis latency >50ms p95
- Rate limit violations >100/hour
- Cache miss rate >30%
- Redis memory usage >80%

### 8.3 Dashboards

**Redis Overview:**
- Command rate, latency, errors
- Memory usage, connection count
- Top commands by volume

**Application Performance:**
- Cache hit rates
- Rate limit violations
- Session metrics
- Cost tracking

---

## 9. Cost Analysis

### 9.1 Current Costs
- **Rate Limiting:** $0 (in-memory)
- **Caching:** $0 (database + in-memory)
- **Sessions:** $0 (database)
- **Total:** $0/month

### 9.2 Projected Redis Costs (Upstash)

**Assumptions:**
- 1M requests/day
- Average 3 Redis commands per request
- 3M commands/day = 90M commands/month

**Pricing:**
- Free tier: 10K commands/day (300K/month)
- Paid: $0.20 per 100K commands
- Additional: 87M commands = $174/month

**Optimization Opportunities:**
- Batch operations (reduce commands by 30%)
- Cache warming (reduce cache misses)
- TTL optimization (reduce key churn)
- **Optimized cost: ~$120/month**

### 9.3 Cost Optimization Strategies
1. **Command Reduction:**
   - Use pipelining for batch operations
   - Combine multiple operations into one Lua script
   - Cache frequently accessed data in application memory

2. **Key Management:**
   - Implement efficient key expiration
   - Use appropriate TTLs (not too long)
   - Clean up unused keys regularly

3. **Tiered Caching:**
   - Hot data in Redis
   - Warm data in application memory
   - Cold data in database

4. **Monitoring:**
   - Track command usage per feature
   - Identify expensive operations
   - Set cost alerts

### 9.4 Alternative: Self-Hosted Redis

**Railway/Fly.io:**
- $5-20/month for small instance
- Higher operational overhead
- Better cost at scale (>500M commands/month)

**Recommendation:** Start with Upstash, migrate to self-hosted if cost exceeds $200/month.

---

## 10. Timeline

### Phase 1: Foundation (Weeks 1-2)
- **Week 1:** Redis setup, client implementation, health checks
- **Week 2:** Testing, documentation, team training

### Phase 2: Rate Limiting (Weeks 3-4)
- **Week 3:** Migrate rate limiters, IP quarantine
- **Week 4:** Testing, monitoring, optimization

### Phase 3: Caching (Weeks 5-6)
- **Week 5:** Migrate buying guides, AI guides
- **Week 6:** Additional caches, invalidation, warming

### Phase 4: Sessions (Weeks 7-8)
- **Week 7:** Session storage, lookup optimization
- **Week 8:** Real-time features, testing

### Phase 5: Metrics (Weeks 9-10)
- **Week 9:** Metrics migration, dashboards
- **Week 10:** Analytics, reporting

### Phase 6: Cleanup (Weeks 11-12)
- **Week 11:** Code cleanup, optimization
- **Week 12:** Documentation, knowledge transfer

**Total Duration: 12 weeks (3 months)**

---

## 11. Risk Assessment & Mitigation

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Redis downtime | High | Low | In-memory fallback, circuit breaker |
| Data loss | High | Low | Database backup for critical data |
| Performance degradation | Medium | Medium | Thorough load testing, monitoring |
| Cost overrun | Medium | Medium | Cost alerts, optimization |
| Migration bugs | High | Medium | Phased rollout, comprehensive testing |

### 11.2 Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Team knowledge gap | Medium | Low | Training, documentation |
| Deployment issues | Medium | Low | Staged deployment, rollback plan |
| Monitoring gaps | Low | Medium | Comprehensive dashboards, alerts |

---

## 12. Success Criteria

### 12.1 Performance Metrics
- ✅ Rate limit check latency: <5ms p99
- ✅ Cache lookup latency: <3ms p99
- ✅ Session lookup latency: <10ms p99
- ✅ Redis availability: >99.9%

### 12.2 Functional Metrics
- ✅ Zero data loss during migration
- ✅ All rate limiters working correctly
- ✅ Cache hit rate >80%
- ✅ Session management fully functional

### 12.3 Business Metrics
- ✅ Cost increase <$150/month
- ✅ No user-facing downtime
- ✅ Improved scalability (10x traffic capacity)

---

## 13. Post-Migration Tasks

### 13.1 Immediate (Week 13)
- [ ] Monitor Redis performance 24/7
- [ ] Review cost vs. budget
- [ ] Gather team feedback
- [ ] Fix any critical issues

### 13.2 Short-term (Months 2-3)
- [ ] Optimize expensive operations
- [ ] Fine-tune TTLs based on usage
- [ ] Implement advanced features (cache warming, preloading)
- [ ] Remove database cache tables (if not needed)

### 13.3 Long-term (Months 4-6)
- [ ] Consider self-hosted Redis if cost-effective
- [ ] Implement Redis clustering if needed
- [ ] Advanced analytics and insights
- [ ] Share learnings with team

---

## 14. Appendix

### 14.1 Environment Variables

```bash
# Redis Configuration
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
USE_REDIS=true

# Feature Flags
REDIS_RATE_LIMITING=true
REDIS_CACHING=true
REDIS_SESSIONS=true

# Fallback Configuration
REDIS_FALLBACK_ENABLED=true
REDIS_CIRCUIT_BREAKER_THRESHOLD=30
REDIS_HEALTH_CHECK_INTERVAL=30

# Cost Management
REDIS_MAX_COMMANDS_PER_DAY=5000000
REDIS_COST_ALERT_THRESHOLD=150
```

### 14.2 Key Dependencies

```json
{
  "@upstash/redis": "^1.0.0",
  "@upstash/ratelimit": "^2.0.0",
  "lru-cache": "^10.0.0" // Fallback
}
```

### 14.3 Useful Commands

```bash
# Redis CLI (via Upstash dashboard)
# Or use Upstash REST API

# Check key
GET cache:guide:toyota-prius-2020

# Check rate limit
GET rl:api:1.2.3.4

# List all keys (use with caution)
KEYS cache:*

# Get memory usage
INFO memory

# Flush all (testing only)
FLUSHALL
```

### 14.4 References

- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Upstash Ratelimit Documentation](https://docs.upstash.com/ratelimit)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

## Document Version History

- **v1.0** (2025-01-XX): Initial comprehensive plan
- Future versions will track implementation progress and adjustments

---

**Next Steps:**
1. Review and approve plan
2. Set up Upstash Redis instance
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews


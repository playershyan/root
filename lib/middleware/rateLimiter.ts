import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'
import { incr } from '@/lib/security/metrics'
// Dynamically import Upstash libs only if enabled (avoid Jest/ESM issues)

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Maximum requests per interval
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  uniqueTokenPerInterval?: number // Max unique tokens per interval
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

// Create different rate limiters for different purposes
const rateLimiterMap = new Map<string, LRUCache<string, number[]>>()

// Optional distributed limiter (Upstash Redis) support
const useUpstash = (process.env.USE_UPSTASH || '').toLowerCase() === 'true'
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

type UpstashCtx = { Ratelimit: any, Redis: any, redis: any }
let upstashCtx: UpstashCtx | null = null
const upstashLimiters = new Map<string, any>()

async function getUpstashLimiter(name: string, intervalMs: number, max: number): Promise<any | null> {
  if (!(useUpstash && upstashUrl && upstashToken)) return null
  try {
    if (!upstashCtx) {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: upstashUrl, token: upstashToken })
      upstashCtx = { Ratelimit, Redis, redis }
    }
    const key = `${name}:${intervalMs}:${max}`
    if (upstashLimiters.has(key)) return upstashLimiters.get(key)!
    const limiter = new upstashCtx.Ratelimit({
      redis: upstashCtx.redis,
      limiter: upstashCtx.Ratelimit.fixedWindow(max, `${Math.round(intervalMs / 1000)} s`),
      analytics: false,
      prefix: `rl:${name}`,
    })
    upstashLimiters.set(key, limiter)
    return limiter
  } catch {
    return null
  }
}

function getRateLimiter(key: string, maxItems = 5000): LRUCache<string, number[]> {
  if (!rateLimiterMap.has(key)) {
    rateLimiterMap.set(key, new LRUCache<string, number[]>({
      max: maxItems,
      ttl: 60 * 60 * 1000, // 1 hour TTL
    }))
  }
  return rateLimiterMap.get(key)!
}

export function rateLimit(config: RateLimitConfig, name = 'generic') {
  const testIsolatedKey = process.env.JEST_WORKER_ID ? `-jest-${process.env.JEST_WORKER_ID}-${Date.now()}-${Math.random()}` : ''
  const limiter = getRateLimiter(`${name}-${config.interval}-${config.maxRequests}${testIsolatedKey}`)
  const instancePrefix = process.env.JEST_WORKER_ID ? `jest-${Date.now()}-${Math.random()}-` : ''
  
  return async function checkRateLimit(
    request: NextRequest,
    identifier?: string
  ): Promise<RateLimitResult> {
    // Distributed path if configured
    const up = await getUpstashLimiter(name, config.interval, config.maxRequests)
    if (up) {
      const id = identifier || getIdentifier(request)
      try {
        const res = await up.limit(id)
        const reset = new Date(Date.now() + config.interval)
        const ok = res.success
        if (ok) incr(`ratelimit.hit.${name}`)
        else incr(`ratelimit.block.${name}`)
        return {
          success: res.success,
          limit: config.maxRequests,
          remaining: Math.max(0, res.remaining),
          reset,
        }
      } catch (_) {
        // Fallback to in-memory on error
      }
    }

    // Get identifier from request if not provided
    const id = (identifier || getIdentifier(request))
    const cacheKey = instancePrefix ? `${instancePrefix}${id}` : id
    const now = Date.now()
    const windowStart = now - config.interval
    
    // Get existing timestamps for this identifier
    const timestamps = limiter.get(cacheKey) || []
    
    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    
    // Check if limit exceeded
    if (validTimestamps.length >= config.maxRequests) {
      incr(`ratelimit.block.${name}`)
      const oldestTimestamp = Math.min(...validTimestamps)
      const reset = new Date(oldestTimestamp + config.interval)
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset
      }
    }
    
    // Add current timestamp
    validTimestamps.push(now)
    limiter.set(cacheKey, validTimestamps)
    
    incr(`ratelimit.hit.${name}`)
    const reset = new Date(now + config.interval)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - validTimestamps.length,
      reset
    }
  }
}

// Get identifier from request (IP + User ID if authenticated)
function getIdentifier(request: NextRequest): string {
  // Derive best-effort IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip')
  const ip = ipHeader || // From proxy headers
            // @ts-ignore - NextRequest may expose ip in some platforms
            (typeof (request as any).ip === 'string' && (request as any).ip) ||
            'unknown'

  // Try to get a stable user identifier (token hash prefix) if present
  const authHeader = request.headers.get('authorization')
  const sanitized = authHeader?.replace(/^Bearer\s+/i, '') || ''
  const userPart = sanitized ? `user-${sanitized.substring(0, 16)}` : 'anonymous'

  return `${ip}-${userPart}`
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: rateLimit({
    interval: 60 * 1000,
    maxRequests: 100
  }, 'api'),
  
  // Auth endpoints: 5 attempts per 15 minutes
  auth: rateLimit({
    interval: 15 * 60 * 1000,
    maxRequests: 5
  }, 'auth'),
  
  // Search: 30 requests per minute
  search: rateLimit({
    interval: 60 * 1000,
    maxRequests: 30
  }, 'search'),
  
  // File upload: 15 uploads per minute (allows 10 concurrent uploads with buffer)
  upload: rateLimit({
    interval: 60 * 1000,
    maxRequests: 15
  }, 'upload'),
  
  // Message sending: 20 messages per minute
  messaging: rateLimit({
    interval: 60 * 1000,
    maxRequests: 20
  }, 'messaging'),
  
  // AI endpoints: 10 requests per minute
  ai: rateLimit({
    interval: 60 * 1000,
    maxRequests: Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 10)
  }, 'ai'),
  // AI daily cap per user/IP: 100 per day
  aiDaily: rateLimit({
    interval: 24 * 60 * 60 * 1000,
    maxRequests: Number(process.env.AI_DAILY_LIMIT || 100)
  }, 'aiDaily'),
  
  // Admin actions: 50 requests per minute
  admin: rateLimit({
    interval: 60 * 1000,
    maxRequests: 50
  }, 'admin'),
  
  // Strict rate limit for sensitive operations: 20 per 15 minutes (allows power users to manage multiple listings)
  strict: rateLimit({
    interval: 15 * 60 * 1000,
    maxRequests: 20
  }, 'strict')
}

// Middleware wrapper for rate limiting
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: ReturnType<typeof rateLimit>,
  identifier?: string
): Promise<NextResponse | null> {
  // Optional quarantine/temporary block by IP
  const quarantineEnabled = (process.env.QUARANTINE_ENABLED || '').toLowerCase() === 'true'
  if (quarantineEnabled) {
    const ip = getClientIp(request)
    if (await isIpBlocked(ip)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests', message: 'Temporarily blocked due to excessive requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  const result = await rateLimiter(request, identifier)
  
  if (!result.success) {
    // Record a strike and possibly block the IP if quarantine is enabled
    if ((process.env.QUARANTINE_ENABLED || '').toLowerCase() === 'true') {
      const ip = getClientIp(request)
      await registerIpStrike(ip)
    }
    const name = (rateLimiter as any)._name || 'generic'
    incr(`ratelimit.response429.${name}`)
    // Track top offenders for ops visibility
    try {
      const ip = getClientIp(request)
      const path = (request as any).nextUrl?.pathname || 'unknown'
      await recordOffender(ip, path)
    } catch {}
    
    const body = JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again after ${result.reset.toISOString()}`,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset.toISOString(),
    })
    return new NextResponse(body, {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toISOString(),
        'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString(),
      },
    })
  }
  
  return null
}

// Rate limit by IP only (for public endpoints)
export function rateLimitByIP(config: RateLimitConfig) {
  const limiter = getRateLimiter(`ip-${config.interval}-${config.maxRequests}`)
  
  return async function(request: NextRequest): Promise<RateLimitResult> {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    const windowStart = now - config.interval
    
    const timestamps = limiter.get(ip) || []
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    
    if (validTimestamps.length >= config.maxRequests) {
      const oldestTimestamp = Math.min(...validTimestamps)
      const reset = new Date(oldestTimestamp + config.interval)
      
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset
      }
    }
    
    validTimestamps.push(now)
    limiter.set(ip, validTimestamps)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - validTimestamps.length,
      reset: new Date(now + config.interval)
    }
  }
}

// --- Quarantine helpers ---
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip')
  // @ts-ignore platform dependent
  return ipHeader || (typeof (request as any).ip === 'string' && (request as any).ip) || 'unknown'
}

const strikesCache = new LRUCache<string, number>({ max: 20000, ttl: 5 * 60 * 1000 })
const blockedCache = new LRUCache<string, number>({ max: 20000, ttl: 10 * 60 * 1000 })

async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false
  // Prefer Upstash if configured
  const up = await getUpstash()
  const banTtl = Number(process.env.QUARANTINE_BAN_SECONDS || 600)
  if (up) {
    try {
      const key = `q:block:${ip}`
      const val = await up.redis.get(key)
      return !!val
    } catch {
      // fall through
    }
  }
  // Fallback in-memory
  return blockedCache.has(ip)
}

async function registerIpStrike(ip: string): Promise<void> {
  if (!ip || ip === 'unknown') return
  const threshold = Number(process.env.QUARANTINE_THRESHOLD || 5)
  const windowSec = Number(process.env.QUARANTINE_WINDOW_SECONDS || 120)
  const banSec = Number(process.env.QUARANTINE_BAN_SECONDS || 600)

  const up = await getUpstash()
  if (up) {
    try {
      const skey = `q:strikes:${ip}`
      const count = await up.redis.incr(skey)
      if (count === 1) {
        await up.redis.expire(skey, windowSec)
      }
      if (count >= threshold) {
        await up.redis.set(`q:block:${ip}`, '1', { ex: banSec })
      }
      return
    } catch {
      // fallback
    }
  }

  // Fallback in-memory
  const existing = strikesCache.get(ip) || 0
  const next = existing + 1
  strikesCache.set(ip, next, { ttl: windowSec * 1000 })
  if (next >= threshold) {
    blockedCache.set(ip, Date.now(), { ttl: banSec * 1000 })
  }
}

async function getUpstash() {
  if (!(useUpstash && upstashUrl && upstashToken)) return null
  if (!upstashCtx) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({ url: upstashUrl, token: upstashToken })
      upstashCtx = { Ratelimit, Redis, redis }
    } catch {
      return null
    }
  }
  return upstashCtx
}

// Admin snapshots and controls
export function getQuarantineSnapshot() {
  return {
    strikesSize: strikesCache.size,
    blockedSize: blockedCache.size,
  }
}

export async function unblockIp(ip: string) {
  if (!ip) return
  blockedCache.delete(ip)
  const up = await getUpstash()
  if (up) {
    try { await up.redis.del(`q:block:${ip}`) } catch {}
  }
}

export function resetQuarantineCaches() {
  strikesCache.clear()
  blockedCache.clear()
}

// --- Offender tracking (top IPs and paths) ---
const localOffenderIp = new Map<string, number>()
const localOffenderPath = new Map<string, number>()

function dayKey(base: string) {
  const d = new Date().toISOString().slice(0,10).replace(/-/g,'')
  return `${base}:d:${d}`
}

async function recordOffender(ip: string, path: string) {
  if (ip) localOffenderIp.set(ip, (localOffenderIp.get(ip) || 0) + 1)
  if (path) localOffenderPath.set(path, (localOffenderPath.get(path) || 0) + 1)

  const up = await getUpstash()
  if (!up) return
  try {
    const ipKey = dayKey('abuse:429:by:ip')
    const pathKey = dayKey('abuse:429:by:path')
    await Promise.all([
      ip ? up.redis.zincrby(ipKey, 1, ip) : Promise.resolve(null),
      path ? up.redis.zincrby(pathKey, 1, path) : Promise.resolve(null),
      up.redis.expire(ipKey, 172800),
      up.redis.expire(pathKey, 172800),
    ])
  } catch {}
}

export async function getTopOffenders(limit = 10): Promise<{ ips: Array<{ id: string, count: number }>, paths: Array<{ id: string, count: number }> }> {
  const up = await getUpstash()
  if (up) {
    try {
      const ipKey = dayKey('abuse:429:by:ip')
      const pathKey = dayKey('abuse:429:by:path')
      const [ipsRaw, pathsRaw] = await Promise.all([
        up.redis.zrevrange(ipKey, 0, limit - 1, { withScores: true } as any),
        up.redis.zrevrange(pathKey, 0, limit - 1, { withScores: true } as any),
      ])
      const ips: Array<{ id: string, count: number }> = []
      for (let i = 0; i < (ipsRaw?.length || 0); i += 2) {
        ips.push({ id: ipsRaw[i], count: Number(ipsRaw[i+1]) })
      }
      const paths: Array<{ id: string, count: number }> = []
      for (let i = 0; i < (pathsRaw?.length || 0); i += 2) {
        paths.push({ id: pathsRaw[i], count: Number(pathsRaw[i+1]) })
      }
      return { ips, paths }
    } catch {}
  }
  // Fallback to local maps
  const ips = Array.from(localOffenderIp.entries()).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([id,count])=>({id, count}))
  const paths = Array.from(localOffenderPath.entries()).sort((a,b)=>b[1]-a[1]).slice(0, limit).map(([id,count])=>({id, count}))
  return { ips, paths }
}

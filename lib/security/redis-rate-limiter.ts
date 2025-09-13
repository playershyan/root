/**
 * Redis-based distributed rate limiting using Upstash
 * Provides persistent, scalable rate limiting across multiple instances
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis client (use Upstash or Vercel KV)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Fallback to in-memory if Redis not configured
const inMemoryStore = new Map<string, { count: number; reset: number }>()

/**
 * Rate limiter configurations using token bucket algorithm
 * Allows burst traffic while maintaining overall rate limits
 */
export const rateLimiters = {
  // General API: 100 req/min with burst of 20
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(100, '1 m', 20),
    analytics: true,
    prefix: 'rl:api',
  }) : null,

  // Auth endpoints: 5 attempts per 15 min (prevent credential stuffing)
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'),
    analytics: true,
    prefix: 'rl:auth',
  }) : null,

  // OTP sending: 3 per hour (prevent SMS bombing)
  otp: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '1 h'),
    analytics: true,
    prefix: 'rl:otp',
  }) : null,

  // Search: 30 req/min with burst of 10
  search: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(30, '1 m', 10),
    analytics: true,
    prefix: 'rl:search',
  }) : null,

  // File upload: 10 per hour (prevent storage abuse)
  upload: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'rl:upload',
  }) : null,

  // Messaging: 20 per minute with burst of 5
  messaging: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(20, '1 m', 5),
    analytics: true,
    prefix: 'rl:msg',
  }) : null,

  // AI endpoints: Dual limit (per minute and daily)
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.tokenBucket(
      Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 10),
      '1 m',
      3
    ),
    analytics: true,
    prefix: 'rl:ai',
  }) : null,

  aiDaily: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(
      Number(process.env.AI_DAILY_LIMIT || 100),
      '24 h'
    ),
    analytics: true,
    prefix: 'rl:ai:daily',
  }) : null,

  // Admin actions: 50 req/min
  admin: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
    prefix: 'rl:admin',
  }) : null,

  // Strict: For password reset, account deletion
  strict: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '1 h'),
    analytics: true,
    prefix: 'rl:strict',
  }) : null,

  // Report abuse: Prevent spam reports
  report: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '1 h'),
    analytics: true,
    prefix: 'rl:report',
  }) : null,

  // Contact form: Prevent spam
  contact: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '15 m'),
    analytics: true,
    prefix: 'rl:contact',
  }) : null,
}

/**
 * Get identifier from request (IP + User ID if authenticated)
 */
export function getIdentifier(request: NextRequest): string {
  // Get IP address (handle various proxy headers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  const ip = (forwarded?.split(',')[0].trim()) || 
             cfConnectingIp ||
             realIp || 
             'unknown'

  // Get user identifier if authenticated
  const authHeader = request.headers.get('authorization')
  const userId = request.headers.get('x-user-id')
  
  if (userId) {
    return `user:${userId}:${ip}`
  } else if (authHeader) {
    // Hash the token for privacy
    const tokenHash = authHeader.replace(/^Bearer\s+/i, '').substring(0, 16)
    return `token:${tokenHash}:${ip}`
  }
  
  return `anon:${ip}`
}

/**
 * In-memory fallback for development/testing
 */
async function inMemoryRateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now()
  const key = `${identifier}:${window}`
  const record = inMemoryStore.get(key)

  if (!record || record.reset < now) {
    inMemoryStore.set(key, { count: 1, reset: now + window })
    return { success: true, limit, remaining: limit - 1, reset: now + window }
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.reset }
  }

  record.count++
  return { success: true, limit, remaining: limit - record.count, reset: record.reset }
}

/**
 * Check rate limit with Redis or fallback to in-memory
 */
export async function checkRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters,
  identifier?: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  headers: Record<string, string>
}> {
  const id = identifier || getIdentifier(request)
  const limiter = rateLimiters[limiterType]

  // Use Redis if available
  if (limiter) {
    try {
      const { success, limit, remaining, reset } = await limiter.limit(id)
      
      return {
        success,
        limit,
        remaining,
        reset,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': success ? '0' : Math.ceil((reset - Date.now()) / 1000).toString(),
        }
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fall through to in-memory
    }
  }

  // Fallback to in-memory rate limiting
  const limits = {
    api: { limit: 100, window: 60000 },
    auth: { limit: 5, window: 900000 },
    otp: { limit: 3, window: 3600000 },
    search: { limit: 30, window: 60000 },
    upload: { limit: 10, window: 3600000 },
    messaging: { limit: 20, window: 60000 },
    ai: { limit: 10, window: 60000 },
    aiDaily: { limit: 100, window: 86400000 },
    admin: { limit: 50, window: 60000 },
    strict: { limit: 3, window: 3600000 },
    report: { limit: 5, window: 3600000 },
    contact: { limit: 3, window: 900000 },
  }

  const config = limits[limiterType]
  const result = await inMemoryRateLimit(id, config.limit, config.window)

  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      'Retry-After': result.success ? '0' : Math.ceil((result.reset - Date.now()) / 1000).toString(),
    }
  }
}

/**
 * Middleware wrapper for rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters,
  options?: {
    identifier?: string
    errorMessage?: string
    skipSuccessful?: boolean
  }
): Promise<NextResponse | null> {
  const result = await checkRateLimit(request, limiterType, options?.identifier)

  if (!result.success) {
    // Log rate limit violation for monitoring
    console.warn(`Rate limit exceeded: ${limiterType} for ${options?.identifier || getIdentifier(request)}`)
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: options?.errorMessage || `Rate limit exceeded. Please try again later.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString(),
      },
      {
        status: 429,
        headers: result.headers,
      }
    )
  }

  return null
}

/**
 * IP quarantine for repeated violations
 */
const quarantineMap = new Map<string, { violations: number; until: number }>()

export async function checkQuarantine(request: NextRequest): Promise<boolean> {
  const ip = getIdentifier(request).split(':').pop() || 'unknown'
  const record = quarantineMap.get(ip)

  if (!record) return false
  if (record.until < Date.now()) {
    quarantineMap.delete(ip)
    return false
  }

  return true
}

export function addViolation(request: NextRequest): void {
  const ip = getIdentifier(request).split(':').pop() || 'unknown'
  const record = quarantineMap.get(ip)
  const now = Date.now()

  if (!record) {
    quarantineMap.set(ip, { violations: 1, until: now + 60000 }) // 1 min initial
  } else {
    record.violations++
    // Exponential backoff: 1min, 5min, 15min, 1hr, 24hr
    const durations = [60000, 300000, 900000, 3600000, 86400000]
    const duration = durations[Math.min(record.violations - 1, durations.length - 1)]
    record.until = now + duration
  }
}

/**
 * Clean up old quarantine records periodically
 */
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of quarantineMap.entries()) {
    if (record.until < now) {
      quarantineMap.delete(ip)
    }
  }
}, 60000) // Clean every minute
import { NextRequest, NextResponse } from 'next/server'
import { LRUCache } from 'lru-cache'

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

function getRateLimiter(key: string, maxItems = 5000): LRUCache<string, number[]> {
  if (!rateLimiterMap.has(key)) {
    rateLimiterMap.set(key, new LRUCache<string, number[]>({
      max: maxItems,
      ttl: 60 * 60 * 1000, // 1 hour TTL
    }))
  }
  return rateLimiterMap.get(key)!
}

export function rateLimit(config: RateLimitConfig) {
  const limiter = getRateLimiter(`${config.interval}-${config.maxRequests}`)
  
  return async function checkRateLimit(
    request: NextRequest,
    identifier?: string
  ): Promise<RateLimitResult> {
    // Get identifier from request if not provided
    const id = identifier || getIdentifier(request)
    const now = Date.now()
    const windowStart = now - config.interval
    
    // Get existing timestamps for this identifier
    const timestamps = limiter.get(id) || []
    
    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    
    // Check if limit exceeded
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
    
    // Add current timestamp
    validTimestamps.push(now)
    limiter.set(id, validTimestamps)
    
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
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // Try to get user ID from authorization header or cookie
  const authHeader = request.headers.get('authorization')
  const userId = authHeader ? 
    `user-${authHeader.replace('Bearer ', '').substring(0, 16)}` : 
    'anonymous'
  
  return `${ip}-${userId}`
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: rateLimit({
    interval: 60 * 1000,
    maxRequests: 100
  }),
  
  // Auth endpoints: 5 attempts per 15 minutes
  auth: rateLimit({
    interval: 15 * 60 * 1000,
    maxRequests: 5
  }),
  
  // Search: 30 requests per minute
  search: rateLimit({
    interval: 60 * 1000,
    maxRequests: 30
  }),
  
  // File upload: 10 uploads per hour
  upload: rateLimit({
    interval: 60 * 60 * 1000,
    maxRequests: 10
  }),
  
  // Message sending: 20 messages per minute
  messaging: rateLimit({
    interval: 60 * 1000,
    maxRequests: 20
  }),
  
  // AI endpoints: 10 requests per minute
  ai: rateLimit({
    interval: 60 * 1000,
    maxRequests: 10
  }),
  
  // Admin actions: 50 requests per minute
  admin: rateLimit({
    interval: 60 * 1000,
    maxRequests: 50
  }),
  
  // Strict rate limit for sensitive operations: 3 per hour
  strict: rateLimit({
    interval: 60 * 60 * 1000,
    maxRequests: 3
  })
}

// Middleware wrapper for rate limiting
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: ReturnType<typeof rateLimit>,
  identifier?: string
): Promise<NextResponse | null> {
  const result = await rateLimiter(request, identifier)
  
  if (!result.success) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${result.reset.toISOString()}`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset.toISOString()
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
        }
      }
    )
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
/**
 * Comprehensive security middleware
 * Combines rate limiting, payload validation, and abuse prevention
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, checkQuarantine, addViolation } from './redis-rate-limiter'
import { verifyRecaptcha } from './recaptcha'

/**
 * Payload size limits per endpoint type
 */
const PAYLOAD_LIMITS = {
  // Small payloads for auth/AI
  auth: 1024 * 5,        // 5KB
  ai: 1024 * 25,         // 25KB  
  otp: 1024 * 2,         // 2KB
  
  // Medium payloads for forms
  contact: 1024 * 10,    // 10KB
  report: 1024 * 10,     // 10KB
  messaging: 1024 * 50,  // 50KB
  
  // Larger payloads for listings
  listing: 1024 * 100,   // 100KB
  profile: 1024 * 50,    // 50KB
  
  // File uploads (separate from JSON payloads)
  upload: 1024 * 1024 * 10, // 10MB
  
  // Default
  default: 1024 * 100    // 100KB
}

/**
 * Endpoints requiring reCAPTCHA for anonymous users
 */
const CAPTCHA_REQUIRED_ENDPOINTS = [
  '/api/auth/send-email-otp',
  '/api/auth/send-phone-otp',
  '/api/auth/verify-email-otp',
  '/api/auth/verify-phone-otp',
  '/api/reports/create',
  '/api/contact',
  '/api/upload',
  '/api/ai-description',
  '/api/generate-ai-guide',
]

/**
 * Check payload size based on endpoint
 */
export function checkPayloadSize(
  request: NextRequest,
  endpoint: string
): { valid: boolean; limit: number; actual?: number } {
  const contentLength = Number(request.headers.get('content-length') || '0')
  
  // Determine limit based on endpoint
  let limit = PAYLOAD_LIMITS.default
  
  if (endpoint.includes('/auth/')) limit = PAYLOAD_LIMITS.auth
  else if (endpoint.includes('/ai')) limit = PAYLOAD_LIMITS.ai
  else if (endpoint.includes('/otp')) limit = PAYLOAD_LIMITS.otp
  else if (endpoint.includes('/contact')) limit = PAYLOAD_LIMITS.contact
  else if (endpoint.includes('/report')) limit = PAYLOAD_LIMITS.report
  else if (endpoint.includes('/message')) limit = PAYLOAD_LIMITS.messaging
  else if (endpoint.includes('/listing')) limit = PAYLOAD_LIMITS.listing
  else if (endpoint.includes('/profile')) limit = PAYLOAD_LIMITS.profile
  else if (endpoint.includes('/upload')) limit = PAYLOAD_LIMITS.upload
  
  if (contentLength > limit) {
    return { valid: false, limit, actual: contentLength }
  }
  
  return { valid: true, limit }
}

/**
 * Check if request is from authenticated user
 */
export function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const userId = request.headers.get('x-user-id')
  return !!(authHeader || userId)
}

/**
 * Security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

/**
 * Main security middleware
 */
export async function securityMiddleware(
  request: NextRequest,
  options: {
    endpoint: string
    rateLimit?: keyof typeof import('./redis-rate-limiter').rateLimiters
    requireAuth?: boolean
    requireCaptcha?: boolean
    customPayloadLimit?: number
  }
): Promise<NextResponse | null> {
  const { endpoint, rateLimit = 'api', requireAuth = false, requireCaptcha } = options

  // 1. Check IP quarantine
  if (await checkQuarantine(request)) {
    return NextResponse.json(
      { error: 'Access temporarily blocked due to repeated violations' },
      { status: 403, headers: getSecurityHeaders() }
    )
  }

  // 2. Check authentication if required
  if (requireAuth && !isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: getSecurityHeaders() }
    )
  }

  // 3. Check payload size
  const payloadCheck = checkPayloadSize(request, endpoint)
  if (!payloadCheck.valid) {
    addViolation(request) // Track violation
    return NextResponse.json(
      { 
        error: 'Payload too large',
        message: `Request body exceeds ${payloadCheck.limit} bytes limit`,
        limit: payloadCheck.limit,
        actual: payloadCheck.actual
      },
      { status: 413, headers: getSecurityHeaders() }
    )
  }

  // 4. Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimit)
  if (rateLimitResponse) {
    addViolation(request) // Track violation
    return rateLimitResponse
  }

  // 5. Check reCAPTCHA for sensitive endpoints (anonymous users only)
  const shouldCheckCaptcha = requireCaptcha !== undefined 
    ? requireCaptcha 
    : CAPTCHA_REQUIRED_ENDPOINTS.includes(endpoint)
    
  if (shouldCheckCaptcha && !isAuthenticated(request)) {
    try {
      const body = await request.clone().json()
      const { recaptchaToken } = body
      
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded?.split(',')[0].trim() || request.headers.get('x-real-ip')
      
      const captcha = await verifyRecaptcha(recaptchaToken, ip)
      
      if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
        console.warn(`reCAPTCHA failed for ${endpoint} from ${ip}, score: ${captcha.score}`)
        addViolation(request) // Track violation
        
        return NextResponse.json(
          { 
            error: 'Verification failed',
            message: 'Please complete the security check',
            minScore: 0.3,
            actualScore: captcha.score
          },
          { status: 400, headers: getSecurityHeaders() }
        )
      }
    } catch (error) {
      // Allow request if we can't parse body (might be multipart)
      console.warn(`Could not verify reCAPTCHA for ${endpoint}:`, error)
    }
  }

  // 6. Check for additional AI-specific limits
  if (endpoint.includes('/ai')) {
    // Check daily limit
    const dailyLimit = await withRateLimit(request, 'aiDaily')
    if (dailyLimit) {
      return dailyLimit
    }
  }

  return null // Request passed all checks
}

/**
 * Log security events for monitoring
 */
export interface SecurityEvent {
  type: 'rate_limit' | 'payload_size' | 'captcha_fail' | 'quarantine' | 'auth_fail'
  endpoint: string
  identifier: string
  metadata?: Record<string, any>
  timestamp: Date
}

const securityEvents: SecurityEvent[] = []
const MAX_EVENTS = 1000 // Keep last 1000 events in memory

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  securityEvents.push({
    ...event,
    timestamp: new Date()
  })
  
  // Trim old events
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.splice(0, securityEvents.length - MAX_EVENTS)
  }
  
  // Log to console for monitoring systems
  console.log('[SECURITY]', JSON.stringify(event))
}

export function getSecurityEvents(
  filter?: { type?: string; since?: Date }
): SecurityEvent[] {
  let events = [...securityEvents]
  
  if (filter?.type) {
    events = events.filter(e => e.type === filter.type)
  }
  
  if (filter?.since) {
    events = events.filter(e => e.timestamp >= filter.since)
  }
  
  return events
}

/**
 * Middleware for file uploads with virus scanning simulation
 */
export async function uploadSecurityMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Apply standard security checks
  const securityCheck = await securityMiddleware(request, {
    endpoint: '/api/upload',
    rateLimit: 'upload',
    requireCaptcha: true
  })
  
  if (securityCheck) return securityCheck
  
  // Additional upload-specific checks would go here
  // - File type validation
  // - Virus scanning
  // - Image EXIF stripping
  
  return null
}
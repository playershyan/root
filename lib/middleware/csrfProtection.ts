import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_FORM_FIELD = '_csrf'

// Methods that require CSRF protection
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']

// Routes that are exempt from CSRF protection (e.g., API webhooks, public endpoints)
const EXEMPT_ROUTES = [
  '/api/auth/callback',
  '/api/webhooks/',
  '/api/cron/',
]

export interface CSRFConfig {
  secret?: string
  exemptRoutes?: string[]
  cookieName?: string
  headerName?: string
  formField?: string
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(secret?: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  if (secret) {
    // Create a hash using the secret to make tokens more secure
    const hash = createHash('sha256')
    hash.update(token + secret)
    return hash.digest('hex')
  }
  return token
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, expectedToken: string, secret?: string): boolean {
  if (!token || !expectedToken) {
    return false
  }

  if (secret) {
    // Verify hashed token
    const hash = createHash('sha256')
    hash.update(token + secret)
    return hash.digest('hex') === expectedToken
  }

  // Direct comparison for simple tokens
  return token === expectedToken
}

/**
 * Get CSRF token from request (header, form field, or query parameter)
 */
export function getCSRFTokenFromRequest(
  request: NextRequest, 
  config: CSRFConfig = {}
): string | null {
  const headerName = config.headerName || CSRF_HEADER_NAME
  const formField = config.formField || CSRF_FORM_FIELD

  // Check header first
  const headerToken = request.headers.get(headerName)
  if (headerToken) {
    return headerToken
  }

  // For form submissions, check form data
  if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    // This would need to be handled in the actual route handler
    // since we can't read the body here without consuming it
    return null
  }

  // Check query parameter as fallback
  const url = new URL(request.url)
  const queryToken = url.searchParams.get(formField)
  if (queryToken) {
    return queryToken
  }

  return null
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFTokenFromCookie(
  request: NextRequest,
  config: CSRFConfig = {}
): string | null {
  const cookieName = config.cookieName || CSRF_COOKIE_NAME
  return request.cookies.get(cookieName)?.value || null
}

/**
 * Check if route is exempt from CSRF protection
 */
export function isExemptRoute(pathname: string, exemptRoutes: string[] = []): boolean {
  const allExemptRoutes = [...EXEMPT_ROUTES, ...exemptRoutes]
  return allExemptRoutes.some(route => pathname.startsWith(route))
}

/**
 * CSRF protection middleware
 */
export async function csrfProtection(
  request: NextRequest,
  config: CSRFConfig = {}
): Promise<NextResponse | null> {
  const method = request.method
  const pathname = request.nextUrl.pathname

  // Skip CSRF protection for safe methods
  if (!PROTECTED_METHODS.includes(method)) {
    return null
  }

  // Skip CSRF protection for exempt routes
  if (isExemptRoute(pathname, config.exemptRoutes)) {
    return null
  }

  // Get tokens
  const requestToken = getCSRFTokenFromRequest(request, config)
  const cookieToken = getCSRFTokenFromCookie(request, config)

  // Verify token exists
  if (!requestToken || !cookieToken) {
    return NextResponse.json(
      { 
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request'
      },
      { 
        status: 403,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        }
      }
    )
  }

  // Verify token validity
  if (!verifyCSRFToken(requestToken, cookieToken, config.secret)) {
    return NextResponse.json(
      { 
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed'
      },
      { 
        status: 403,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        }
      }
    )
  }

  // Token is valid, continue with request
  return null
}

/**
 * Create CSRF token response (for GET requests to fetch token)
 */
export function createCSRFTokenResponse(config: CSRFConfig = {}): NextResponse {
  const token = generateCSRFToken(config.secret)
  const cookieName = config.cookieName || CSRF_COOKIE_NAME
  
  const response = NextResponse.json({ csrfToken: token })
  
  // Set secure cookie with CSRF token
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })

  return response
}

/**
 * Middleware wrapper for CSRF protection
 */
export function withCSRFProtection(config: CSRFConfig = {}) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return csrfProtection(request, config)
  }
}

/**
 * Extract CSRF token from form data (for use in API routes)
 */
export async function extractCSRFFromFormData(request: NextRequest): Promise<string | null> {
  if (!request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    return null
  }

  try {
    const formData = await request.formData()
    return formData.get(CSRF_FORM_FIELD) as string || null
  } catch {
    return null
  }
}

/**
 * Verify CSRF token from request body (for JSON requests)
 */
export async function verifyCSRFFromBody(
  request: NextRequest,
  config: CSRFConfig = {}
): Promise<boolean> {
  try {
    const body = await request.json()
    const token = body[config.formField || CSRF_FORM_FIELD]
    const cookieToken = getCSRFTokenFromCookie(request, config)
    
    if (!token || !cookieToken) {
      return false
    }

    return verifyCSRFToken(token, cookieToken, config.secret)
  } catch {
    return false
  }
}
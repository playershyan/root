import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { logger } from '@/lib/utils/logger'

/**
 * Generates Supabase-compatible JWT tokens for custom auth flows
 *
 * Use this when using custom OTP providers (e.g., text.lk) instead of Supabase's
 * built-in Twilio/MessageBird SMS auth.
 *
 * @param userId - Supabase auth.users.id
 * @param expiresIn - Token expiry time (default: 1 hour for access, 7 days for refresh)
 */
export function generateSupabaseAccessToken(userId: string, expiresIn: string = '1h'): string {
  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET environment variable not set')
  }

  const now = Math.floor(Date.now() / 1000)

  // Supabase JWT payload structure
  const payload = {
    aud: 'authenticated',
    exp: now + getExpirySeconds(expiresIn),
    iat: now,
    sub: userId,
    email: '', // Optional, can be populated if user has email
    phone: '', // Optional, can be populated if user has phone
    app_metadata: {
      provider: 'phone',
      providers: ['phone']
    },
    user_metadata: {},
    role: 'authenticated',
    aal: 'aal1', // Authentication Assurance Level
    amr: [{ method: 'otp', timestamp: now }], // Authentication Method Reference
    session_id: generateSessionId()
  }

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
}

export function generateSupabaseRefreshToken(userId: string): string {
  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET environment variable not set')
  }

  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 * 7 // 7 days

  const payload = {
    aud: 'authenticated',
    exp: now + expiresIn,
    iat: now,
    sub: userId,
    email: '',
    phone: '',
    app_metadata: {
      provider: 'phone',
      providers: ['phone']
    },
    user_metadata: {},
    role: 'authenticated',
    aal: 'aal1',
    amr: [{ method: 'otp', timestamp: now }],
    session_id: generateSessionId()
  }

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' })
}

/**
 * Generates both access and refresh tokens
 */
export function generateSupabaseTokens(userId: string, userEmail?: string, userPhone?: string) {
  const JWT_SECRET = process.env.SUPABASE_JWT_SECRET

  if (!JWT_SECRET) {
    logger.error('SUPABASE_JWT_SECRET not configured', new Error('Missing JWT secret'))
    throw new Error('SUPABASE_JWT_SECRET environment variable not set')
  }

  const now = Math.floor(Date.now() / 1000)
  const sessionId = generateSessionId()

  const basePayload = {
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: userEmail || '',
    phone: userPhone || '',
    app_metadata: {
      provider: 'phone',
      providers: ['phone']
    },
    user_metadata: {},
    aal: 'aal1',
    amr: [{ method: 'otp', timestamp: now }],
    session_id: sessionId
  }

  // Access token: 1 hour
  const accessToken = jwt.sign(
    {
      ...basePayload,
      iat: now,
      exp: now + 3600 // 1 hour
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  )

  // Refresh token: 7 days
  const refreshToken = jwt.sign(
    {
      ...basePayload,
      iat: now,
      exp: now + (60 * 60 * 24 * 7) // 7 days
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  )

  const expiresAt = now + 3600

  logger.debug('Generated Supabase JWT tokens', {
    userId,
    hasEmail: !!userEmail,
    hasPhone: !!userPhone,
    expiresAt: new Date(expiresAt * 1000).toISOString()
  })

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer'
  }
}

function generateSessionId(): string {
  return randomUUID()
}

function getExpirySeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) return 3600 // Default 1 hour

  const value = parseInt(match[1])
  const unit = match[2]

  switch (unit) {
    case 's': return value
    case 'm': return value * 60
    case 'h': return value * 60 * 60
    case 'd': return value * 60 * 60 * 24
    default: return 3600
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { textlkService } from '@/lib/services/textlkService'
import { logger } from '@/lib/utils/logger'
import { normalizeSriLankaPhone, isValidSriLankanPhone, toE164 } from '@/lib/utils/phoneFormatter'
import { findUserByPhone } from '@/lib/auth/phoneLookup'

// Simple OTP generation function
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // For registration, use service role client to bypass RLS
    // For existing users, use regular client with user authentication
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    const { phoneNumber, recaptchaToken, isRegistration, isPhoneUpdate, flow: rawFlow } = await request.json()
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Normalize phone once for all downstream usage
    const normalizedPhone = normalizeSriLankaPhone(phoneNumber)

    // Validate normalized phone format
    if (!isValidSriLankanPhone(normalizedPhone)) {
      return NextResponse.json({
        error: 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
      }, { status: 400 })
    }

    // Derive unified flow value for backwards compatibility
    // New clients should pass `flow`, old clients use isRegistration/isPhoneUpdate.
    let flow: 'register' | 'login' | 'phone_update'
    if (rawFlow === 'register' || rawFlow === 'login' || rawFlow === 'phone_update') {
      flow = rawFlow
    } else if (isPhoneUpdate) {
      flow = 'phone_update'
    } else if (typeof isRegistration === 'boolean') {
      flow = isRegistration ? 'register' : 'login'
    } else {
      flow = 'login'
    }

    logger.debug('Send OTP request', {
      flow,
      isRegistration,
      isPhoneUpdate,
      hasRecaptchaToken: !!recaptchaToken
    })

    // For registration flow, we don't have a user yet, so use null for user_id
    // For existing users, get the authenticated user ID
    let userId: string | null = null
    let dbClient = supabase // Use regular client by default

    // Flow-specific handling
    if (flow === 'login') {
      // For login flow, find user by phone number (user is not authenticated yet)
      // Use service role client to find user by phone number
      if (!serviceRoleKey || !supabaseUrl) {
        const missing = !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_URL'
        logger.error('Service role key or URL not configured for login', new Error(`Missing: ${missing}`), {
          hasServiceRoleKey: !!serviceRoleKey,
          hasSupabaseUrl: !!supabaseUrl
        })
        return NextResponse.json({ 
          error: 'Server configuration error',
          details: `Missing required environment variable: ${missing}. Please configure SUPABASE_SERVICE_ROLE_KEY in Vercel.`
        }, { status: 500 })
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Find user by phone number using shared helper (handles normalization internally)
      const { user: matchingUser, error: lookupError } = await findUserByPhone(adminClient as any, normalizedPhone)

      if (lookupError || !matchingUser) {
        logger.debug('User not found for login OTP', {
          phoneNumber,
          normalizedPhone,
          lookupError
        })
        return NextResponse.json({
          error: 'No account found with this phone number. Please sign up first.'
        }, { status: 404 })
      }

      userId = matchingUser.id
      dbClient = adminClient // Use admin client for database operations
      logger.debug('Found user for login OTP', { userId, phoneNumber })
    } else if (flow === 'phone_update') {
      // Authenticated user updating phone (profile/listings/wanted)
      const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authenticatedUser) {
        logger.error('Authenticated user required for phone update OTP', authError as Error)
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      userId = authenticatedUser.id
      dbClient = supabase // Use regular client for authenticated users
      logger.debug('Using authenticated user for phone update OTP', { userId, phoneNumber })
    } else {
      // Registration flow (no user yet) - use service role client to bypass RLS
      if (serviceRoleKey && supabaseUrl) {
        dbClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
        logger.debug('Using service role client for registration', { hasServiceRoleKey: true })
      } else {
        const missing = !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_URL'
        logger.error('Service role key or URL not configured', new Error(`Missing: ${missing}`), {
          hasServiceRoleKey: !!serviceRoleKey,
          hasSupabaseUrl: !!supabaseUrl
        })
        return NextResponse.json({ 
          error: 'Server configuration error',
          details: `Missing required environment variable: ${missing}. Please configure SUPABASE_SERVICE_ROLE_KEY in Vercel.`
        }, { status: 500 })
      }
    }

    // Verify reCAPTCHA to prevent OTP abuse
    // Only required for login flows; register and phone_update rely on rate limiting.
    if (flow === 'login') {
      if (!recaptchaToken) {
        return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 })
      }

      const forwarded = request.headers.get('x-forwarded-for')
      const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
      const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)

      logger.debug('reCAPTCHA result', { success: captcha.success, score: captcha.score })

      if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
        logger.warn('reCAPTCHA failed', { score: captcha.score })
        return captchaGuardFailJson(0.3)
      }
    }

    // Validate phone number format using Text.lk service
    const isValidPhone = textlkService.validatePhoneNumber(normalizedPhone)
    if (!isValidPhone) {
      return NextResponse.json({
        error: 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
      }, { status: 400 })
    }

    // Check for rate limiting (max 3 OTPs per hour per user/phone)
    // Use dbClient (service role for registration, regular for existing users)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    let rateLimitQuery = dbClient
      .from('phone_verifications')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('phone_number', normalizedPhone)

    // Distinguish between true registration (no user yet) and authenticated updates
    const isRegistrationWithoutUser = flow === 'register' && !userId

    // For authenticated users (profile/listing/wanted updates), include both their user_id
    // and any legacy/null records for this phone. For true registration, only null user_id.
    if (userId && !isRegistrationWithoutUser) {
      rateLimitQuery = rateLimitQuery.or(`user_id.eq.${userId},user_id.is.null`)
    } else {
      rateLimitQuery = rateLimitQuery.is('user_id', null)
    }

    const { data: recentOtps, error: countError } = await rateLimitQuery

    if (countError) {
      logger.error('Error checking OTP rate limit', countError as Error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (recentOtps && recentOtps.length >= 3) {
      return NextResponse.json({ 
        error: 'Too many OTP requests. Please wait an hour before requesting again.' 
      }, { status: 429 })
    }

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Delete ANY existing OTPs for this phone number to avoid unique constraint
    // This includes BOTH verified and unverified records
    // Use dbClient (service role for registration, regular for existing users)
    if (userId && !isRegistrationWithoutUser) {
      // Authenticated updates: remove ALL records (verified and unverified) for this user + phone
      await dbClient
        .from('phone_verifications')
        .delete()
        .eq('phone_number', normalizedPhone)
        .or(`user_id.eq.${userId},user_id.is.null`)
    } else if (isRegistrationWithoutUser) {
      // True registration: only remove records with null user_id for this phone
      await dbClient
        .from('phone_verifications')
        .delete()
        .eq('phone_number', normalizedPhone)
        .is('user_id', null)
    } else {
      // Fallback: delete all records for this phone number
      await dbClient
        .from('phone_verifications')
        .delete()
        .eq('phone_number', normalizedPhone)
    }

    // Store OTP in database
    // For registration: user_id is null (will be set when user is created)
    // For existing users: user_id is the authenticated user's ID
    // Use dbClient (service role for registration bypasses RLS)
    const { error: insertError } = await dbClient
      .from('phone_verifications')
      .insert({
        user_id: userId, // null for registration, user ID for existing users
        phone_number: normalizedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })

    // Log successful OTP creation for debugging
    if (!insertError) {
      logger.debug('OTP record created', {
        userId: userId || 'null',
        phoneNumber,
        otpLength: otp.length,
        expiresAt: expiresAt.toISOString(),
        isRegistration
      })
    }

    if (insertError) {
      // Supabase errors are objects with message, code, details, hint, constraint properties
      const errorObj = insertError as any
      const errorMsg = typeof insertError === 'string' 
        ? insertError 
        : errorObj?.message || 'Database insert failed'
      const errorCode = errorObj?.code || 'INSERT_ERROR'
      const errorDetails = errorObj?.details || errorObj?.hint
      const constraint = errorObj?.constraint as string | undefined

      logger.error('Error storing OTP', new Error(errorMsg), {
        error: insertError,
        errorCode,
        errorDetails,
        constraint,
        phoneNumber: normalizedPhone,
        userId,
        flow,
        hasServiceRoleKey: !!serviceRoleKey
      })

      // If the unique_pending_verification constraint is hit, it usually means
      // this number already has a pending or completed verification entry.
      // Return a clear, user-facing message instead of a generic 500.
      if (
        errorCode === '23505' &&
        (constraint === 'unique_pending_verification' ||
          (typeof errorDetails === 'string' && errorDetails.includes('unique_pending_verification')))
      ) {
        return NextResponse.json({
          error: 'This number is already verified or an OTP was already sent.',
          code: errorCode
        }, { status: 400 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to generate OTP',
        details: errorMsg,
        code: errorCode,
        hint: errorDetails
      }, { status: 500 })
    }

    // Update profile with temp phone number (only for existing users)
    if (flow === 'login' || flow === 'phone_update') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          temp_phone: normalizedPhone,
          temp_phone_otp_sent_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        logger.error('Error updating profile', profileError as Error)
      }
    }

    // Send SMS using Text.lk service
    const smsResult = await textlkService.sendOTP(normalizedPhone, otp)

    if (!smsResult.success) {
      // Log error but still return success in development mode
      logger.error('SMS sending failed', new Error(smsResult.error || 'Unknown SMS error'))

      // In production, return error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          error: smsResult.error || 'Failed to send SMS'
        }, { status: 500 })
      }

      // In development, continue (OTP is still stored in DB)
      logger.debug('Development Mode - OTP generated', { otp })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
      logger.error('Send phone OTP error', error as Error, {
      error: errorMessage,
      stack: errorStack,
      hasPhoneNumber: !!phoneNumber
    })
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      message: 'Failed to send OTP. Please try again.'
    }, { status: 500 })
  }
}

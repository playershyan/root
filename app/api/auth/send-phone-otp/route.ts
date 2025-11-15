import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { textlkService } from '@/lib/services/textlkService'
import { logger } from '@/lib/utils/logger'

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
    
    const { phoneNumber, recaptchaToken, isRegistration } = await request.json()

    logger.debug('Send OTP request', { isRegistration, hasRecaptchaToken: !!recaptchaToken })

    // For registration flow, we don't have a user yet, so use null for user_id
    // For existing users, get the authenticated user ID
    let userId: string | null = null
    let dbClient = supabase // Use regular client by default

    // For login flow, find user by phone number (user is not authenticated yet)
    if (!isRegistration) {
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

      // Format phone number to E.164 for Supabase auth lookup
      let e164PhoneNumber = phoneNumber.trim()
      const cleanPhone = e164PhoneNumber.replace(/[^\d+]/g, '')
      
      if (cleanPhone.startsWith('+')) {
        e164PhoneNumber = cleanPhone
      } else if (cleanPhone.startsWith('0')) {
        e164PhoneNumber = `+94${cleanPhone.substring(1)}`
      } else if (cleanPhone.startsWith('94')) {
        e164PhoneNumber = `+${cleanPhone}`
      } else {
        e164PhoneNumber = `+94${cleanPhone}`
      }

      // Find user by phone number using admin API
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
      
      if (listError) {
        logger.error('Error listing users for login OTP', listError as Error, { phoneNumber })
        return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
      }

      // Find user matching this phone number
      const matchingUser = users?.find(user => 
        user.phone === e164PhoneNumber || 
        user.phone === phoneNumber ||
        user.user_metadata?.phone === phoneNumber
      )

      if (!matchingUser) {
        logger.debug('User not found for login OTP', { phoneNumber, e164PhoneNumber })
        return NextResponse.json({
          error: 'No account found with this phone number. Please sign up first.'
        }, { status: 404 })
      }

      userId = matchingUser.id
      dbClient = adminClient // Use admin client for database operations
      logger.debug('Found user for login OTP', { userId, phoneNumber })
    } else {
      // For registration, use service role client to bypass RLS
      // This allows inserting records with null user_id
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

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Verify reCAPTCHA to prevent OTP abuse (skip for registration if no token provided)
    if (recaptchaToken) {
      const forwarded = request.headers.get('x-forwarded-for')
      const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
      const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)

      logger.debug('reCAPTCHA result', { success: captcha.success, score: captcha.score })

      if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
        logger.warn('reCAPTCHA failed', { score: captcha.score })
        return captchaGuardFailJson(0.3)
      }
    } else if (!isRegistration) {
      // Require reCAPTCHA for existing user flows
      return NextResponse.json({ error: 'reCAPTCHA verification required' }, { status: 400 })
    }
    // Skip reCAPTCHA for registration flows without token

    // Validate phone number format using Text.lk service
    const isValidPhone = textlkService.validatePhoneNumber(phoneNumber)
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
      .eq('phone_number', phoneNumber)

    // For registration, check by phone number only (user_id will be null)
    // For existing users, also filter by user_id if available
    if (!isRegistration && userId) {
      rateLimitQuery = rateLimitQuery.or(`user_id.eq.${userId},user_id.is.null`)
    } else {
      // For registration, check by phone number only
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

    // Delete any existing unverified OTPs for this phone number
    // Use dbClient (service role for registration, regular for existing users)
    const deleteQuery = dbClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', phoneNumber)
      .eq('verified', false)
    
    if (isRegistration) {
      // For registration, delete records with null user_id for this phone
      await deleteQuery.is('user_id', null)
    } else if (userId) {
      // For existing users, delete records matching this user_id or null
      await deleteQuery.or(`user_id.eq.${userId},user_id.is.null`)
    } else {
      // Fallback: just delete by phone number
      await deleteQuery
    }

    // Store OTP in database
    // For registration: user_id is null (will be set when user is created)
    // For existing users: user_id is the authenticated user's ID
    // Use dbClient (service role for registration bypasses RLS)
    const { error: insertError } = await dbClient
      .from('phone_verifications')
      .insert({
        user_id: userId, // null for registration, user ID for existing users
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })

    if (insertError) {
      // Supabase errors are objects with message, code, details, hint properties
      const errorMsg = typeof insertError === 'string' 
        ? insertError 
        : (insertError as any)?.message || 'Database insert failed'
      const errorCode = (insertError as any)?.code || 'INSERT_ERROR'
      const errorDetails = (insertError as any)?.details || (insertError as any)?.hint
      
      logger.error('Error storing OTP', new Error(errorMsg), {
        error: insertError,
        errorCode,
        errorDetails,
        phoneNumber,
        userId,
        isRegistration,
        hasServiceRoleKey: !!serviceRoleKey
      })
      
      return NextResponse.json({ 
        error: 'Failed to generate OTP',
        details: errorMsg,
        code: errorCode,
        hint: errorDetails
      }, { status: 500 })
    }

    // Update profile with temp phone number (only for existing users)
    if (!isRegistration) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          temp_phone: phoneNumber,
          temp_phone_otp_sent_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) {
        logger.error('Error updating profile', profileError as Error)
      }
    }

    // Send SMS using Text.lk service
    const smsResult = await textlkService.sendOTP(phoneNumber, otp)

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
      isRegistration,
      hasPhoneNumber: !!phoneNumber
    })
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      message: 'Failed to send OTP. Please try again.'
    }, { status: 500 })
  }
}

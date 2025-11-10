import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
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

    const { phoneNumber, recaptchaToken, isRegistration } = await request.json()

    logger.debug('Send OTP request', { isRegistration, hasRecaptchaToken: !!recaptchaToken })

    // For registration flow, create a temporary user record if needed
    let userId: string

    if (isRegistration) {
      // Generate a temporary user ID for registration
      userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } else {
      // Original flow - require authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      userId = user.id
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
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    let rateLimitQuery = supabase
      .from('phone_verifications')
      .select('id')
      .gte('created_at', oneHourAgo)

    if (isRegistration) {
      // For registration, limit by phone number
      rateLimitQuery = rateLimitQuery.eq('phone_number', phoneNumber)
    } else {
      // For existing users, limit by user ID
      rateLimitQuery = rateLimitQuery.eq('user_id', userId)
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

    // Delete any existing unverified OTPs for this user/phone
    if (isRegistration) {
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
    } else {
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('phone_number', phoneNumber)
        .eq('verified', false)
    }

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: userId,
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })

    if (insertError) {
      logger.error('Error storing OTP', insertError as Error)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
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
    logger.error('Send phone OTP error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

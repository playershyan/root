import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { textlkService } from '@/lib/services/textlkService'
import { logger } from '@/lib/utils/logger'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from '@/lib/utils/phoneFormatter'

/**
 * Phone OTP Sending API - Phone Update Only
 *
 * This endpoint is ONLY for authenticated users updating their phone number
 * on profile, listings, or wanted posts.
 *
 * Authentication flows (login/registration) are disabled and will be
 * reimplemented using Supabase native auth providers.
 */

// Simple OTP generation function
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { phoneNumber } = await request.json()

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

    logger.debug('Send OTP request for phone update', {
      phoneNumber: normalizedPhone
    })

    // ONLY authenticated users can update phone numbers
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authenticatedUser) {
      logger.error('Authentication required for phone update OTP', authError as Error)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = authenticatedUser.id
    logger.debug('Authenticated user for phone update OTP', { userId, phoneNumber })

    // Validate phone number format using Text.lk service
    const isValidPhone = textlkService.validatePhoneNumber(normalizedPhone)
    if (!isValidPhone) {
      return NextResponse.json({
        error: 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
      }, { status: 400 })
    }

    // Use service role client to bypass RLS for phone_verifications table
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      logger.error('Service role key or URL not configured', new Error('Missing env vars'))
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check for rate limiting (max 3 OTPs per hour per user/phone)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentOtps, error: countError } = await adminClient
      .from('phone_verifications')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('phone_number', normalizedPhone)
      .or(`user_id.eq.${userId},user_id.is.null`)

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

    // Delete existing pending OTPs for this user + phone to avoid unique constraint
    // Use service role client to bypass RLS
    const { error: deleteError } = await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', normalizedPhone)
      .eq('user_id', userId)
      .eq('verified', false)

    if (deleteError) {
      logger.error('Error deleting existing pending OTPs', deleteError as Error, {
        phoneNumber: normalizedPhone,
        userId
      })
    }

    // Store OTP in database using service role client
    const { error: insertError } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: userId,
        phone_number: normalizedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })

    if (!insertError) {
      logger.debug('OTP record created for phone update', {
        userId,
        phoneNumber: normalizedPhone,
        expiresAt: expiresAt.toISOString()
      })
    }

    if (insertError) {
      const errorObj = insertError as any
      const errorMsg = typeof insertError === 'string'
        ? insertError
        : errorObj?.message || 'Database insert failed'
      const errorCode = errorObj?.code || 'INSERT_ERROR'

      logger.error('Error storing OTP for phone update', new Error(errorMsg), {
        error: insertError,
        errorCode,
        phoneNumber: normalizedPhone,
        userId
      })

      return NextResponse.json({
        error: 'Failed to generate OTP',
        details: errorMsg,
        code: errorCode
      }, { status: 500 })
    }

    // Update profile with temp phone number
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        temp_phone: normalizedPhone,
        temp_phone_otp_sent_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      logger.error('Error updating profile with temp phone', profileError as Error)
    }

    // Send SMS using Text.lk service
    const smsResult = await textlkService.sendOTP(normalizedPhone, otp)

    if (!smsResult.success) {
      logger.error('SMS sending failed for phone update', new Error(smsResult.error || 'Unknown SMS error'))

      // In production, return error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          error: smsResult.error || 'Failed to send SMS'
        }, { status: 500 })
      }

      // In development, continue (OTP is still stored in DB)
      logger.debug('Development Mode - OTP generated for phone update', { otp })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error('Send phone OTP error (phone update)', error as Error, {
      error: errorMessage,
      stack: errorStack
    })

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      message: 'Failed to send OTP. Please try again.'
    }, { status: 500 })
  }
}

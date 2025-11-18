import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from '@/lib/utils/phoneFormatter'

/**
 * Phone OTP Verification API - Phone Update Only
 *
 * This endpoint is ONLY for authenticated users verifying their phone number update
 * on profile, listings, or wanted posts.
 *
 * Authentication flows (login/registration) are disabled and will be
 * reimplemented using Supabase native auth providers.
 *
 * This endpoint DOES NOT create sessions - it only verifies the OTP and returns success.
 */

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otpCode, purpose } = await request.json()

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({
        error: 'Phone number and OTP code are required'
      }, { status: 400 })
    }

    // Normalize phone
    const normalizedPhone = normalizeSriLankaPhone(phoneNumber)
    const trimmedOtpCode = otpCode.trim()

    // Validate normalized phone format
    if (!isValidSriLankanPhone(normalizedPhone)) {
      return NextResponse.json({
        error: 'Invalid phone number format'
      }, { status: 400 })
    }

    logger.debug('Verify OTP request for phone update', {
      phoneNumber: normalizedPhone,
      hasOtpCode: !!otpCode
    })

    // ONLY authenticated users can verify phone updates
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authenticatedUser) {
      logger.error('Authentication required for phone verification', authError as Error)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = authenticatedUser.id
    logger.debug('Processing phone verification for authenticated user', { userId, phoneNumber: normalizedPhone })

    // Use service role client to bypass RLS for phone_verifications table
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      const missing = !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_URL'
      logger.error('Service role key or URL not configured', new Error(`Missing: ${missing}`))
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find the most recent unverified OTP for this phone number + user
    const { data: otpRecord, error: otpError } = await adminClient
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('otp_code', trimmedOtpCode)
      .eq('verified', false)
      .eq('user_id', userId) // Must match authenticated user
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      logger.warn('OTP verification failed for phone update', {
        error: otpError,
        errorCode: (otpError as any)?.code,
        hasRecord: !!otpRecord,
        phoneNumber: normalizedPhone,
        userId
      })

      // PostgREST "no rows" error - invalid/expired code
      const otpErrorCode = (otpError as any)?.code
      if (!otpRecord && otpError && (otpErrorCode === 'PGRST116' || otpErrorCode === 'PGRST123')) {
        return NextResponse.json({
          error: 'Invalid or expired verification code'
        }, { status: 400 })
      }

      // Generic "no record found" case
      if (!otpRecord) {
        return NextResponse.json({
          error: 'Invalid or expired verification code'
        }, { status: 400 })
      }

      // Any other database error
      if (otpError) {
        logger.error('Database error during OTP verification', otpError as Error, {
          phoneNumber: normalizedPhone,
          userId
        })
        return NextResponse.json({
          error: 'Verification failed. Please try again.'
        }, { status: 500 })
      }
    }

    // Check attempt limit
    if (otpRecord.attempts >= 3) {
      return NextResponse.json({
        error: 'Too many verification attempts. Please request a new code.'
      }, { status: 400 })
    }

    // Increment attempt counter
    // For listing/wanted flows: do NOT mark as verified (API will verify it)
    // For profile flows: mark as verified immediately
    const shouldMarkVerified = purpose === 'profile'

    const updatePayload: any = {
      attempts: (otpRecord.attempts || 0) + 1
    }

    if (shouldMarkVerified) {
      updatePayload.verified = true
      updatePayload.verified_at = new Date().toISOString()
    }

    const { error: updateError } = await adminClient
      .from('phone_verifications')
      .update(updatePayload)
      .eq('id', otpRecord.id)

    if (updateError) {
      logger.error('Error updating OTP record for phone update', updateError as Error)
      return NextResponse.json({
        error: 'Verification failed'
      }, { status: 500 })
    }

    logger.info('Phone OTP verified successfully for update', {
      userId: otpRecord.user_id,
      phoneNumber: normalizedPhone,
      otpRecordId: otpRecord.id,
      attemptCount: otpRecord.attempts + 1
    })

    return NextResponse.json({
      success: true,
      userId: otpRecord.user_id,
      message: 'Phone number verified successfully',
      verified: true
    })

  } catch (error) {
    logger.error('Verify phone OTP error (phone update)', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

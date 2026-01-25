import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from './phoneFormatter'

/**
 * Phone OTP Verification API - Phone Update Only
 *
 * This endpoint is ONLY for authenticated users verifying their phone number update
 * on profile, listings, or wanted posts.
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

    // ONLY authenticated users can verify phone updates
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authenticatedUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = authenticatedUser.id

    // Use service role client to bypass RLS for phone_verifications table
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
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
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      const otpErrorCode = (otpError as any)?.code
      if (!otpRecord && otpError && (otpErrorCode === 'PGRST116' || otpErrorCode === 'PGRST123')) {
        return NextResponse.json({
          error: 'Invalid or expired verification code'
        }, { status: 400 })
      }

      if (!otpRecord) {
        return NextResponse.json({
          error: 'Invalid or expired verification code'
        }, { status: 400 })
      }

      if (otpError) {
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
      return NextResponse.json({
        error: 'Verification failed'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      userId: otpRecord.user_id,
      message: 'Phone number verified successfully',
      verified: true
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


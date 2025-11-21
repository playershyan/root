import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, whatsapp, avatar_url, location, language, bio')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found', success: false }, { status: 404 })
    }

    return NextResponse.json({ data: profile, success: true })
  } catch (error) {
    logger.error('Error in GET /api/profiles', error as Error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    const body = await request.json()
    logger.debug('PUT /api/profiles - Received data', { hasData: !!body })

    const { name, phone, whatsapp, phoneOtpCode, location, bio, avatar_url, language } = body

    // Normalize phone number for consistent format matching
    const normalizedPhone = phone ? normalizeSriLankaPhone(phone) : phone

    console.log('[PROFILE API] Request received', {
      userId: user.id,
      phone,
      normalizedPhone,
      hasPhoneOtpCode: !!phoneOtpCode,
      phoneOtpCode: phoneOtpCode || 'NONE'
    })

    // Get current profile to check if phone changed
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      logger.error('Error fetching current profile', fetchError as Error)
      return NextResponse.json({ error: 'Failed to fetch profile', success: false }, { status: 500 })
    }

    console.log('[PROFILE API] Current profile', {
      currentPhone: currentProfile?.phone,
      newPhone: normalizedPhone
    })

    // Check if phone number changed (compare normalized values)
    const phoneChanged = normalizedPhone && normalizedPhone !== currentProfile?.phone

    console.log('[PROFILE API] Phone change check', {
      phoneChanged,
      hasOtpCode: !!phoneOtpCode
    })

    // If phone changed, require OTP verification
    if (phoneChanged) {
      console.log('[PROFILE API] Phone changed, checking OTP')

      if (!phoneOtpCode) {
        console.log('[PROFILE API] ERROR: No OTP code provided')
        return NextResponse.json({
          error: 'OTP verification required for phone number change',
          requiresOTP: true
        }, { status: 400 })
      }

      console.log('[PROFILE API] Searching for OTP record', {
        phone,
        normalizedPhone,
        phoneOtpCode,
        userId: user.id
      })

      // For profile updates, the OTP is already verified by the modal (purpose='profile')
      // So we search for verified: true records, unlike listings/wanted which search for verified: false
      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', normalizedPhone) // CRITICAL: Use normalized phone to match storage format
        .eq('otp_code', phoneOtpCode)
        .eq('verified', true) // CRITICAL: Profile searches for VERIFIED records
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .single()

      console.log('[PROFILE API] OTP record search result', {
        found: !!otpRecord,
        error: otpError?.message || 'NONE',
        errorCode: (otpError as any)?.code || 'NONE'
      })

      if (otpError || !otpRecord) {
        logger.error('OTP verification failed for profile update', otpError as Error, {
          phone,
          userId: user.id,
          hasRecord: !!otpRecord
        })
        return NextResponse.json({
          error: 'Invalid or expired verification code. Please request a new code.',
          requiresOTP: true
        }, { status: 400 })
      }

      // OTP already verified by modal, no need to update the record again
      console.log('[PROFILE API] OTP record found and already verified', {
        otpRecordId: otpRecord.id,
        attempts: otpRecord.attempts,
        verifiedAt: otpRecord.verified_at
      })

      logger.info('Phone OTP validated for profile update', { userId: user.id, phone: normalizedPhone })
    }

    console.log('[PROFILE API] Updating profile in database', {
      userId: user.id,
      phone: normalizedPhone,
      name
    })

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        name,
        phone: normalizedPhone, // Store normalized phone
        whatsapp,
        location,
        bio,
        avatar_url,
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, name, email, phone, whatsapp, avatar_url, location, language, bio')
      .single()

    if (error) {
      console.log('[PROFILE API] ERROR: Database update failed', {
        error: error.message,
        code: (error as any).code
      })
      logger.error('Database error in profile update', error as Error)
      return NextResponse.json({ error: 'Failed to update profile', success: false, details: error }, { status: 500 })
    }

    console.log('[PROFILE API] SUCCESS: Profile updated', {
      userId: user.id,
      updatedPhone: profile?.phone
    })

    logger.info('Profile updated successfully', { userId: user.id })
    return NextResponse.json({ data: profile, success: true })
  } catch (error) {
    logger.error('Error in PUT /api/profiles', error as Error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}
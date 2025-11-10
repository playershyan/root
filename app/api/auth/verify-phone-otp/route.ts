import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { phoneNumber, otpCode, isRegistration } = await request.json()

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({
        error: 'Phone number and OTP code are required'
      }, { status: 400 })
    }

    // For registration flow, verify OTP without requiring authentication
    if (isRegistration) {
      // Find the OTP record
      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', otpCode)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (otpError || !otpRecord) {
        return NextResponse.json({
          error: 'Invalid or expired verification code'
        }, { status: 400 })
      }

      // Check attempt limit
      if (otpRecord.attempts >= 3) {
        return NextResponse.json({
          error: 'Too many verification attempts. Please request a new code.'
        }, { status: 400 })
      }

      // Mark OTP as verified
      const { error: updateError } = await supabase
        .from('phone_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id)

      if (updateError) {
        logger.error('Error updating OTP record', updateError as Error)
        return NextResponse.json({
          error: 'Verification failed'
        }, { status: 500 })
      }

      // Create a temporary user session or return user ID for account creation
      // For now, return success with user ID from OTP record
      return NextResponse.json({
        success: true,
        userId: otpRecord.user_id,
        message: 'Phone number verified successfully'
      })
    }

    // Original flow for authenticated users
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the database function to verify OTP
    const { data, error } = await supabase.rpc('verify_phone_otp', {
      p_user_id: user.id,
      p_phone_number: phoneNumber,
      p_otp_code: otpCode
    })

    if (error) {
      logger.error('Error verifying OTP', error as Error)
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }

    const result = data?.[0]

    if (!result) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        userId: user.id,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 400 })
    }

  } catch (error) {
    logger.error('Verify phone OTP error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
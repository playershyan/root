import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { textlkService } from '@/lib/services/textlkService'

// Simple OTP generation function
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, recaptchaToken } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Verify reCAPTCHA to prevent OTP abuse (if enabled)
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
    if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
      return captchaGuardFailJson(0.3)
    }

    // Validate phone number format using Text.lk service
    const isValidPhone = textlkService.validatePhoneNumber(phoneNumber)
    if (!isValidPhone) {
      return NextResponse.json({
        error: 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
      }, { status: 400 })
    }

    // Check for rate limiting (max 3 OTPs per hour per user)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentOtps, error: countError } = await supabase
      .from('phone_verifications')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo)
    
    if (countError) {
      console.error('Error checking OTP rate limit:', countError)
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

    // Delete any existing unverified OTPs for this user and phone
    await supabase
      .from('phone_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('phone_number', phoneNumber)
      .eq('verified', false)

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Update profile with temp phone number
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        temp_phone: phoneNumber,
        temp_phone_otp_sent_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
    }

    // Send SMS using Text.lk service
    const smsResult = await textlkService.sendOTP(phoneNumber, otp)

    if (!smsResult.success) {
      // Log error but still return success in development mode
      console.error('SMS sending failed:', smsResult.error)

      // In production, return error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          error: smsResult.error || 'Failed to send SMS'
        }, { status: 500 })
      }

      // In development, continue (OTP is still stored in DB)
      console.log(`📱 Development Mode - OTP: ${otp}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    console.error('Send phone OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

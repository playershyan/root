import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { textlkService } from './textlkService'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from './phoneFormatter'

/**
 * Phone OTP Sending API - Phone Update Only
 *
 * This endpoint is ONLY for authenticated users updating their phone number
 * on profile, listings, or wanted posts.
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

    // ONLY authenticated users can update phone numbers
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authenticatedUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = authenticatedUser.id

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
    await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', normalizedPhone)
      .eq('user_id', userId)
      .eq('verified', false)

    // Store OTP in database
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

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to generate OTP',
        details: insertError
      }, { status: 500 })
    }

    // Update profile with temp phone number (optional - remove if you don't have this field)
    await supabase
      .from('profiles')
      .update({
        temp_phone: normalizedPhone,
        temp_phone_otp_sent_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Send SMS using Text.lk service
    const smsResult = await textlkService.sendOTP(normalizedPhone, otp)

    if (!smsResult.success) {
      // In production, return error
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          error: smsResult.error || 'Failed to send SMS'
        }, { status: 500 })
      }
      // In development, continue (OTP is still stored in DB)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600 // 10 minutes in seconds
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      message: 'Failed to send OTP. Please try again.'
    }, { status: 500 })
  }
}


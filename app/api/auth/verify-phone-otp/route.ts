import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
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
    // Use service role client to bypass RLS (records have user_id = null)
    if (isRegistration) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (!serviceRoleKey || !supabaseUrl) {
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

      // Create service role client to bypass RLS for registration verification
      const dbClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      logger.debug('Using service role client for registration verification', { 
        hasServiceRoleKey: true,
        phoneNumber 
      })

      // Find the OTP record (with null user_id for registration)
      const { data: otpRecord, error: otpError } = await dbClient
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', otpCode)
        .eq('verified', false)
        .is('user_id', null) // Only match records with null user_id (registration)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false }) // Get most recent
        .single()

      if (otpError || !otpRecord) {
        logger.debug('OTP verification failed', {
          error: otpError,
          hasRecord: !!otpRecord,
          phoneNumber,
          isRegistration
        })
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

      // Increment attempt counter before verification
      const { error: attemptError } = await dbClient
        .from('phone_verifications')
        .update({
          attempts: (otpRecord.attempts || 0) + 1
        })
        .eq('id', otpRecord.id)

      if (attemptError) {
        logger.error('Error updating attempt count', attemptError as Error)
      }

      // Mark OTP as verified
      const { error: updateError } = await dbClient
        .from('phone_verifications')
        .update({
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id)

      if (updateError) {
        logger.error('Error updating OTP record', updateError as Error, {
          otpRecordId: otpRecord.id,
          phoneNumber
        })
        return NextResponse.json({
          error: 'Verification failed'
        }, { status: 500 })
      }

      // Return success - user_id will be null for registration (account not created yet)
      return NextResponse.json({
        success: true,
        userId: otpRecord.user_id, // Will be null for registration
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
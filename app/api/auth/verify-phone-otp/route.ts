import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otpCode, isRegistration, isPhoneUpdate } = await request.json()

    // Log which flow is being requested
    logger.debug('Verify OTP request received', {
      phoneNumber,
      isPhoneUpdate,
      isRegistration,
      hasOtpCode: !!otpCode,
      timestamp: new Date().toISOString()
    })

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({
        error: 'Phone number and OTP code are required'
      }, { status: 400 })
    }

    // Trim OTP code to remove any whitespace
    const trimmedOtpCode = otpCode.trim()

    // Handle authenticated user phone updates (for profile/listing/wanted updates)
    // Use service role client to avoid session validation issues
    if (isPhoneUpdate) {
      logger.debug('Processing phone update flow', { phoneNumber })

      // Use service role client to bypass RLS and avoid session validation issues
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      if (!serviceRoleKey || !supabaseUrl) {
        const missing = !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_URL'
        logger.error('Service role key or URL not configured for phone update', new Error(`Missing: ${missing}`))
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

      // First, find the most recent unverified OTP for this phone number
      // We'll verify the user_id from the OTP record itself
      const { data: otpRecord, error: otpError } = await adminClient
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', trimmedOtpCode)
        .eq('verified', false)
        .not('user_id', 'is', null) // Only phone updates (user_id must exist)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (otpError || !otpRecord) {
        logger.warn('OTP verification failed for phone update', {
          error: otpError,
          errorCode: (otpError as any)?.code,
          errorMessage: (otpError as any)?.message,
          hasRecord: !!otpRecord,
          phoneNumber,
          otpCode: trimmedOtpCode.substring(0, 2) + '****', // Log partial OTP for debugging
          timestamp: new Date().toISOString()
        })

        // If we got a PostgREST "no rows" style error (very common when the OTP
        // doesn't match or is expired), treat this as an invalid/expired code,
        // not as a server error.
        const otpErrorCode = (otpError as any)?.code
        if (!otpRecord && otpError && (otpErrorCode === 'PGRST116' || otpErrorCode === 'PGRST123')) {
          return NextResponse.json({
            error: 'Invalid or expired verification code'
          }, { status: 400 })
        }

        // Generic "no record found" case (no otpRecord, but otpError may or may not be set)
        if (!otpRecord) {
          return NextResponse.json({
            error: 'Invalid or expired verification code'
          }, { status: 400 })
        }

        // Any other error with a record present is a true server/database error
        if (otpError) {
          logger.error('Database error during OTP verification', otpError as Error, {
            phoneNumber
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

      // Increment attempt counter and mark OTP as verified
      const { error: updateError } = await adminClient
        .from('phone_verifications')
        .update({
          attempts: (otpRecord.attempts || 0) + 1,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id)

      if (updateError) {
        logger.error('Error updating OTP record for phone update', updateError as Error)
        return NextResponse.json({
          error: 'Verification failed'
        }, { status: 500 })
      }

      logger.info('Phone OTP verified successfully for update', {
        userId: otpRecord.user_id,
        phoneNumber,
        otpRecordId: otpRecord.id,
        attemptCount: otpRecord.attempts + 1,
        timestamp: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        userId: otpRecord.user_id,
        message: 'Phone number verified successfully',
        verified: true
      })
    }

    // For registration and login flows, we need the regular supabase client
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

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
        .eq('otp_code', trimmedOtpCode)
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

    // For login flow: user exists but is not authenticated yet
    // Use service role client to verify OTP and find user by phone
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      const missing = !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_URL'
      logger.error('Service role key or URL not configured', new Error(`Missing: ${missing}`))
      return NextResponse.json({ 
        error: 'Server configuration error',
        details: `Missing required environment variable: ${missing}`
      }, { status: 500 })
    }

    // Create service role client for login verification
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
      logger.error('Error listing users for login', listError as Error, { phoneNumber })
      return NextResponse.json({ error: 'Failed to find user' }, { status: 500 })
    }

    // Find user matching this phone number
    const matchingUser = users?.find(user => 
      user.phone === e164PhoneNumber || 
      user.phone === phoneNumber ||
      user.user_metadata?.phone === phoneNumber
    )

    if (!matchingUser) {
      logger.debug('User not found for login', { phoneNumber, e164PhoneNumber })
      return NextResponse.json({
        error: 'No account found with this phone number. Please sign up first.'
      }, { status: 404 })
    }

    // Verify OTP from database (check both with user_id and null user_id)
    const dbClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    // Check OTP records - could be with user_id or null (from previous registration attempts)
    const { data: otpRecord, error: otpError } = await dbClient
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', trimmedOtpCode)
      .eq('verified', false)
      .or(`user_id.eq.${matchingUser.id},user_id.is.null`)
      .gte('expires_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .single()

    if (otpError || !otpRecord) {
      logger.debug('OTP verification failed for login', {
        error: otpError,
        hasRecord: !!otpRecord,
        phoneNumber,
        userId: matchingUser.id
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

    // Increment attempt counter
    await dbClient
      .from('phone_verifications')
      .update({ attempts: (otpRecord.attempts || 0) + 1 })
      .eq('id', otpRecord.id)

    // Mark OTP as verified and link to user
    const { error: updateError } = await dbClient
      .from('phone_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        user_id: matchingUser.id // Link to user if it was null
      })
      .eq('id', otpRecord.id)

    if (updateError) {
      logger.error('Error updating OTP record for login', updateError as Error)
      return NextResponse.json({
        error: 'Verification failed'
      }, { status: 500 })
    }

    // Create a session for the user after OTP verification
    // Use Supabase Admin API to generate a magic link with recovery type
    // Then extract token and verify it to create a session
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
      
      // Generate a magic link (recovery type) which includes a token hash
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        phone: e164PhoneNumber,
        options: {
          redirectTo: `${siteUrl}/auth/callback?type=recovery`
        }
      })

      if (linkError || !linkData?.properties?.action_link) {
        logger.error('Error generating recovery link for login', linkError as Error, {
          userId: matchingUser.id,
          phoneNumber,
          e164PhoneNumber
        })
        
        // Fallback: Return success - client will need to handle session via another method
        return NextResponse.json({
          success: true,
          userId: matchingUser.id,
          message: 'Phone number verified successfully',
          requiresClientSession: true,
          user: {
            id: matchingUser.id,
            phone: matchingUser.phone
          }
        })
      }

      // Extract token_hash from the recovery link
      // Format: https://.../?token_hash=...&type=recovery
      const recoveryUrl = new URL(linkData.properties.action_link)
      const tokenHash = recoveryUrl.searchParams.get('token_hash')

      if (!tokenHash) {
        logger.error('No token hash in recovery link', new Error('Missing token_hash'), {
          link: linkData.properties.action_link
        })
        return NextResponse.json({
          success: true,
          userId: matchingUser.id,
          message: 'Phone number verified successfully',
          requiresClientSession: true
        })
      }

      // Use the regular Supabase client to verify the recovery token and create session
      // This will create a valid session that gets stored in cookies
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        phone: e164PhoneNumber,
        token_hash: tokenHash,
        type: 'recovery'
      })

      if (verifyError || !verifyData?.session) {
        logger.error('Error verifying recovery token for session', verifyError as Error, {
          userId: matchingUser.id,
          hasSession: !!verifyData?.session
        })
        
        // Fallback: Return success - session creation failed but OTP is verified
        return NextResponse.json({
          success: true,
          userId: matchingUser.id,
          message: 'Phone number verified successfully',
          requiresClientSession: true,
          sessionError: 'Failed to create session automatically'
        })
      }

      // Session created successfully!
      logger.info('Session created successfully for login', {
        userId: matchingUser.id,
        phoneNumber
      })

      return NextResponse.json({
        success: true,
        userId: matchingUser.id,
        message: 'Login successful',
        user: verifyData.user,
        session: {
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
          expires_at: verifyData.session.expires_at
        }
      })

    } catch (sessionError) {
      logger.error('Error creating session for login', sessionError as Error, {
        userId: matchingUser.id
      })
      // Fallback: Return success - client will handle session creation
      return NextResponse.json({
        success: true,
        userId: matchingUser.id,
        message: 'Phone number verified successfully',
        requiresClientSession: true,
        sessionError: (sessionError as Error).message
      })
    }

  } catch (error) {
    logger.error('Verify phone OTP error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    let { userId, username, phoneNumber } = await request.json()

    // For registration, userId will be null - we need to create the user first
    if (!userId && username && phoneNumber) {
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

      // Format phone number to E.164 format for Supabase (must start with +)
      // phoneNumber might come in various formats:
      // - Local format: "0783607777" (starts with 0)
      // - International without +: "94783607777" (starts with country code)
      // - International with +: "+94783607777" (already E.164)
      // We need to convert to E.164: "+94783607777"
      let e164PhoneNumber = phoneNumber.trim()
      
      // Remove any non-numeric characters except +
      const cleanPhone = e164PhoneNumber.replace(/[^\d+]/g, '')
      
      // Convert to E.164 format
      if (cleanPhone.startsWith('+')) {
        // Already has +, use as is
        e164PhoneNumber = cleanPhone
      } else if (cleanPhone.startsWith('0')) {
        // Local format (e.g., 0783607777) -> convert to +94783607777
        e164PhoneNumber = `+94${cleanPhone.substring(1)}`
      } else if (cleanPhone.startsWith('94')) {
        // International format without + (e.g., 94783607777) -> add +
        e164PhoneNumber = `+${cleanPhone}`
      } else {
        // Assume Sri Lankan number without country code (e.g., 783607777)
        e164PhoneNumber = `+94${cleanPhone}`
      }

      // Use service role client to create user
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Create user in Supabase auth with phone number
      // Note: Supabase requires either email or phone for user creation
      // We'll create with phone number as the primary identifier in E.164 format
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        phone: e164PhoneNumber,
        phone_confirmed: true, // Phone is already verified via OTP
        user_metadata: {
          phone: phoneNumber, // Store original format in metadata
          username: username.toLowerCase()
        }
      })

      if (authError || !authData.user) {
        logger.error('Error creating auth user', authError as Error, {
          phoneNumber,
          username
        })
        return NextResponse.json({
          error: 'Failed to create user account'
        }, { status: 500 })
      }

      userId = authData.user.id
      logger.info('Created auth user for registration', { userId, phoneNumber, username })
    }

    if (!userId || !username || !phoneNumber) {
      return NextResponse.json({
        error: 'User ID, username, and phone number are required'
      }, { status: 400 })
    }

    // Validate username format
    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({
        error: 'Username must be between 3 and 20 characters'
      }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return NextResponse.json({
        error: 'Username can only contain letters, numbers, dots, dashes, and underscores'
      }, { status: 400 })
    }

    // Double-check username availability
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({
        error: 'Username is already taken'
      }, { status: 409 })
    }

    // Check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (existingProfile) {
      // Update existing profile with username
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          phone: phoneNumber,
          phone_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        logger.error('Profile update error', updateError as Error)
        return NextResponse.json({
          error: 'Failed to update profile'
        }, { status: 500 })
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username.toLowerCase(),
          phone: phoneNumber,
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        logger.error('Profile creation error', insertError as Error)
        return NextResponse.json({
          error: 'Failed to create profile'
        }, { status: 500 })
      }
    }

    // If we created a new user, also update the phone_verifications record with the user_id
    if (userId && !existingProfile) {
      // Update phone_verifications to link the user_id
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (serviceRoleKey && supabaseUrl) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Update phone_verifications to link to this user
        await adminClient
          .from('phone_verifications')
          .update({ user_id: userId })
          .eq('phone_number', phoneNumber)
          .eq('verified', true)
          .is('user_id', null)
      }
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      message: 'Account created successfully'
    })

  } catch (error) {
    logger.error('Account creation error', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
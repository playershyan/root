import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from '@/lib/utils/phoneFormatter'
import { generateSupabaseTokens } from '@/lib/auth/jwt'

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

      // Normalize phone number to canonical format
      // NOTE: Supabase Admin API strips + prefix, so it stores as 94XXXXXXXXX
      const normalizedPhone = normalizeSriLankaPhone(phoneNumber)

      if (!isValidSriLankanPhone(normalizedPhone)) {
        return NextResponse.json({
          error: 'Invalid phone number format. Please use Sri Lankan format (e.g., 0771234567)'
        }, { status: 400 })
      }

      // Use service role client to create user
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })

      // Create user in Supabase auth with phone number
      // NOTE: Supabase Admin API will strip + prefix and store as 94XXXXXXXXX
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        phone: normalizedPhone, // Pass canonical format directly
        phone_confirmed: true, // Phone is already verified via OTP
        user_metadata: {
          phone: phoneNumber, // Store original format in metadata
          username: username.toLowerCase()
        }
      })

      if (authError || !authData?.user) {
        const authErrorMessage = (authError as any)?.message || 'Unknown Supabase auth error'

        // Handle the case where a user with this phone already exists.
        // Supabase may return messages like "User already registered" or a duplicate key error.
        if (
          authErrorMessage.toLowerCase().includes('already registered') ||
          authErrorMessage.toLowerCase().includes('duplicate key value') ||
          authErrorMessage.toLowerCase().includes('users_phone_key')
        ) {
          try {
            // Attempt to find existing user by phone and reuse their id
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

            if (listError) {
              logger.error('Error listing users after duplicate phone error', listError as Error, {
                phoneNumber,
                username
              })
            } else {
              const existingUser = users?.find(user =>
                user.phone === normalizedPhone ||
                user.user_metadata?.phone === phoneNumber
              )

              if (existingUser) {
                userId = existingUser.id

                // Confirm phone for existing user
                const { error: updateError } = await adminClient.auth.admin.updateUserById(existingUser.id, {
                  phone: normalizedPhone,
                  phone_confirm: true
                })

                if (updateError) {
                  logger.error('Error updating phone for existing user', updateError as Error, {
                    userId: existingUser.id
                  })
                } else {
                  logger.info('Confirmed phone for existing user', {
                    userId: existingUser.id,
                    phone: normalizedPhone
                  })
                }

                logger.info('Using existing auth user for registration', {
                  userId,
                  phoneNumber,
                  username
                })
              }
            }
          } catch (lookupError) {
            logger.error('Error looking up existing auth user after duplicate phone error', lookupError as Error, {
              phoneNumber,
              username
            })
          }

          // If we successfully resolved a userId above, continue the flow instead of failing
          if (!userId) {
            return NextResponse.json({
              error: 'An account with this phone number already exists. Please log in instead.'
            }, { status: 409 })
          }
        } else {
          logger.error('Error creating auth user', authError as Error, {
            phoneNumber,
            username,
            authErrorMessage
          })
          return NextResponse.json({
            error: 'Failed to create user account'
          }, { status: 500 })
        }
      } else {
        userId = authData.user.id
        logger.info('Created auth user for registration', {
          userId,
          phoneNumber,
          username,
          storedPhone: authData.user.phone
        })
      }
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
    // And create a session to automatically log them in
    if (userId && !existingProfile) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      
      if (serviceRoleKey && supabaseUrl) {
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Normalize phone number for database operations
        const normalizedPhone = normalizeSriLankaPhone(phoneNumber)

        // Update phone_verifications to link to this user
        await adminClient
          .from('phone_verifications')
          .update({ user_id: userId })
          .eq('phone_number', normalizedPhone)
          .eq('verified', true)
          .is('user_id', null)

        // Create a session to automatically log the user in after registration
        try {
          // Get user data for JWT payload
          const { data: userData } = await adminClient.auth.admin.getUserById(userId)

          if (!userData?.user) {
            logger.error('Unable to fetch user data for JWT generation', new Error('User not found'), {
              userId,
              phoneNumber
            })
          } else {
            // Generate Supabase-compatible JWT tokens
            const tokens = generateSupabaseTokens(
              userData.user.id,
              userData.user.email,
              userData.user.phone
            )

            // Set session using the generated tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token
            })

            if (sessionError || !sessionData?.session) {
              logger.error('Error setting session for registration', sessionError as Error, {
                userId,
                hasSession: !!sessionData?.session
              })
            } else {
              // Session created successfully!
              logger.info('Session created successfully for new user registration', {
                userId,
                phoneNumber,
                sessionExpiresAt: sessionData.session.expires_at
              })

              return NextResponse.json({
                success: true,
                userId: userId,
                message: 'Account created successfully',
                user: sessionData.user,
                session: {
                  access_token: sessionData.session.access_token,
                  refresh_token: sessionData.session.refresh_token,
                  expires_at: sessionData.session.expires_at
                }
              })
            }
          }
        } catch (sessionError) {
          logger.error('Error creating session after account creation', sessionError as Error, {
            userId
          })
          // Continue to return success even if session creation fails
          // The user can still log in manually
        }
      }
    }

    return NextResponse.json({
      success: true,
      userId: userId,
      message: 'Account created successfully',
      requiresClientSession: true // Indicate client needs to create session if we couldn't create it here
    })

  } catch (error) {
    logger.error('Account creation error', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
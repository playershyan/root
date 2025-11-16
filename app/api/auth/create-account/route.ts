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
                user.phone === e164PhoneNumber ||
                user.phone === phoneNumber ||
                user.user_metadata?.phone === phoneNumber
              )

              if (existingUser) {
                userId = existingUser.id
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
        logger.info('Created auth user for registration', { userId, phoneNumber, username })
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

        // Update phone_verifications to link to this user
        await adminClient
          .from('phone_verifications')
          .update({ user_id: userId })
          .eq('phone_number', phoneNumber)
          .eq('verified', true)
          .is('user_id', null)

        // Create a session to automatically log the user in after registration
        try {
          // Format phone number to E.164 for session creation
          let e164PhoneForSession = phoneNumber.trim()
          const cleanPhone = e164PhoneForSession.replace(/[^\d+]/g, '')
          
          if (cleanPhone.startsWith('+')) {
            e164PhoneForSession = cleanPhone
          } else if (cleanPhone.startsWith('0')) {
            e164PhoneForSession = `+94${cleanPhone.substring(1)}`
          } else if (cleanPhone.startsWith('94')) {
            e164PhoneForSession = `+${cleanPhone}`
          } else {
            e164PhoneForSession = `+94${cleanPhone}`
          }

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
          
          // Generate a magic link (recovery type) which includes a token hash
          const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
            type: 'recovery',
            phone: e164PhoneForSession,
            options: {
              redirectTo: `${siteUrl}/auth/callback?type=recovery`
            }
          })

          if (!linkError && linkData?.properties?.action_link) {
            // Extract token_hash from the recovery link
            const recoveryUrl = new URL(linkData.properties.action_link)
            const tokenHash = recoveryUrl.searchParams.get('token_hash')

            if (tokenHash) {
              // Use the regular Supabase client to verify the recovery token and create session
              // This will create a valid session that gets stored in cookies
              const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                phone: e164PhoneForSession,
                token_hash: tokenHash,
                type: 'recovery'
              })

              if (!verifyError && verifyData?.session) {
                // Session created successfully!
                logger.info('Session created successfully for new user registration', {
                  userId,
                  phoneNumber
                })

                return NextResponse.json({
                  success: true,
                  userId: userId,
                  message: 'Account created successfully',
                  user: verifyData.user,
                  session: {
                    access_token: verifyData.session.access_token,
                    refresh_token: verifyData.session.refresh_token,
                    expires_at: verifyData.session.expires_at
                  }
                })
              } else {
                logger.warn('Failed to create session after account creation', {
                  verifyError,
                  hasSession: !!verifyData?.session
                })
              }
            }
          } else {
            logger.warn('Failed to generate recovery link after account creation', {
              linkError
            })
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
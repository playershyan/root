import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { userId, username, phoneNumber } = await request.json()

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

    return NextResponse.json({
      success: true,
      message: 'Account created successfully'
    })

  } catch (error) {
    logger.error('Account creation error', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, platform, deviceId } = body

    if (!token || !platform) {
      return NextResponse.json(
        { error: 'Token and platform are required' },
        { status: 400 }
      )
    }

    // Store push token in database
    // You'll need to create a push_tokens table with columns:
    // - id (uuid)
    // - user_id (uuid, references auth.users)
    // - token (text)
    // - platform (text)
    // - device_id (text, nullable)
    // - created_at (timestamp)
    // - updated_at (timestamp)

    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          token: token,
          platform: platform,
          device_id: deviceId || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,platform,device_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single()

    if (error) {
      logger.error('Error storing push token', error, { userId: user.id, platform })
      return NextResponse.json(
        { error: 'Failed to register push token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    logger.error('Push token registration error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


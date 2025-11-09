import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()
  
  // Detect browser
  let browserName = 'Unknown Browser'
  let browserVersion = ''
  
  if (ua.includes('chrome')) {
    browserName = 'Chrome'
    const match = ua.match(/chrome\/(\d+\.?\d*)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('firefox')) {
    browserName = 'Firefox'
    const match = ua.match(/firefox\/(\d+\.?\d*)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browserName = 'Safari'
    const match = ua.match(/version\/(\d+\.?\d*)/)
    browserVersion = match ? match[1] : ''
  } else if (ua.includes('edge')) {
    browserName = 'Edge'
    const match = ua.match(/edge\/(\d+\.?\d*)/)
    browserVersion = match ? match[1] : ''
  }
  
  // Detect OS
  let osName = 'Unknown OS'
  let osVersion = ''
  
  if (ua.includes('windows')) {
    osName = 'Windows'
    if (ua.includes('windows nt 10.0')) osVersion = '10'
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1'
    else if (ua.includes('windows nt 6.2')) osVersion = '8'
    else if (ua.includes('windows nt 6.1')) osVersion = '7'
  } else if (ua.includes('mac os x')) {
    osName = 'macOS'
    const match = ua.match(/mac os x (\d+_\d+)/)
    osVersion = match ? match[1].replace('_', '.') : ''
  } else if (ua.includes('linux')) {
    osName = 'Linux'
  } else if (ua.includes('android')) {
    osName = 'Android'
    const match = ua.match(/android (\d+\.?\d*)/)
    osVersion = match ? match[1] : ''
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    osName = ua.includes('iphone') ? 'iOS' : 'iPadOS'
    const match = ua.match(/os (\d+_\d+)/)
    osVersion = match ? match[1].replace('_', '.') : ''
  }
  
  // Detect device type
  let deviceType = 'Desktop'
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    deviceType = 'Mobile'
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'Tablet'
  }
  
  return {
    browser_name: browserName,
    browser_version: browserVersion,
    os_name: osName,
    os_version: osVersion,
    type: deviceType,
    name: `${browserName} on ${osName}`
  }
}

// Helper function to get location info from IP (placeholder)
async function getLocationInfo(ipAddress: string) {
  // In a real implementation, you would use a service like:
  // - ipapi.co
  // - ipgeolocation.io
  // - MaxMind GeoIP2
  
  // For now, return placeholder data
  return {
    city: 'Unknown',
    country: 'Unknown',
    timezone: 'UTC'
  }
}

// GET /api/auth/sessions - Get user's active sessions
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's active sessions
    const { data: sessions, error: sessionsError } = await supabase
      .rpc('get_user_sessions', { p_user_id: user.id })

    if (sessionsError) {
      logger.error('Error fetching sessions', sessionsError as Error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || [],
      current_user_id: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in GET sessions', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/auth/sessions - Create or update session
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    const userAgent = headersList.get('user-agent') || ''
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    
    // Get client IP
    const clientIp = forwardedFor?.split(',')[0] || realIp || request.ip || '127.0.0.1'
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create') {
      // Parse device information
      const deviceInfo = parseUserAgent(userAgent)
      
      // Get location information
      const locationInfo = await getLocationInfo(clientIp)
      
      // Create new session
      const { data: sessionId, error: createError } = await supabase
        .rpc('create_user_session', {
          p_user_id: user.id,
          p_session_token: token,
          p_device_info: deviceInfo,
          p_ip_address: clientIp,
          p_user_agent: userAgent,
          p_location_info: locationInfo
        })

      if (createError) {
        logger.error('Error creating session', createError as Error)
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        session_id: sessionId,
        message: 'Session created successfully',
        timestamp: new Date().toISOString()
      })
      
    } else if (action === 'update') {
      // Update session activity
      const { data: updated, error: updateError } = await supabase
        .rpc('update_session_activity', {
          p_session_token: token
        })

      if (updateError) {
        logger.error('Error updating session', updateError as Error)
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        updated: updated,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    logger.error('Unexpected error in POST sessions', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/auth/sessions - Revoke sessions
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { session_id, action } = body

    if (action === 'revoke_one' && session_id) {
      // Revoke specific session
      const { data: revoked, error: revokeError } = await supabase
        .rpc('revoke_session', {
          p_session_id: session_id,
          p_revoked_by: user.id,
          p_revoke_reason: 'User requested revoke'
        })

      if (revokeError) {
        logger.error('Error revoking session', revokeError as Error)
        return NextResponse.json(
          { error: 'Failed to revoke session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        revoked: revoked,
        message: 'Session revoked successfully',
        timestamp: new Date().toISOString()
      })
      
    } else if (action === 'revoke_others') {
      // Revoke all other sessions except current
      const { data: revokedCount, error: revokeError } = await supabase
        .rpc('revoke_other_sessions', {
          p_user_id: user.id,
          p_keep_session_token: token,
          p_revoked_by: user.id
        })

      if (revokeError) {
        logger.error('Error revoking other sessions', revokeError as Error)
        return NextResponse.json(
          { error: 'Failed to revoke other sessions' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        revoked_count: revokedCount,
        message: `${revokedCount} other sessions revoked successfully`,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({ error: 'Invalid action or missing session_id' }, { status: 400 })

  } catch (error) {
    logger.error('Unexpected error in DELETE sessions', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
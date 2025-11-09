import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
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

    // Get the authorization header
    const authorization = request.headers.get('authorization')
    
    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.replace('Bearer ', '')
      
      // Verify and get user from token
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      
      if (!userError && user) {
        // Log the logout event (optional - for audit purposes)
        logger.audit('User logged out', {
          email: user.email,
          timestamp: new Date().toISOString()
        })

        // You could add additional cleanup here if needed
        // For example: clear user sessions, update last_seen, etc.
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Logout error', error as Error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error during logout',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
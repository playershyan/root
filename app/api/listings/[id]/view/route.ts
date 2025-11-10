import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1'
    
    // Call the enhanced view increment function with rate limiting
    const { data: result, error } = await supabase.rpc('increment_listing_views_enhanced', {
      listing_id: params.id,
      viewer_ip: clientIp,
      viewer_user_id: user?.id || null
    })
    
    if (error) {
      logger.error('Error incrementing views', error, { listingId: params.id })
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      view_recorded: result,
      message: result ? 'View recorded' : 'View not recorded (rate limited or owner)'
    })
  } catch (error) {
    logger.error('View increment error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
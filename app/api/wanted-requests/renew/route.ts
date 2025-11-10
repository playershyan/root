import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get wanted request ID from request body
    const { requestId } = await request.json()
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Wanted request ID is required' },
        { status: 400 }
      )
    }

    // First, check if the wanted request belongs to the user and get its posted date
    const { data: wantedRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('posted_date, user_id, status')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !wantedRequest) {
      return NextResponse.json(
        { error: 'Wanted request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (wantedRequest.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to renew this wanted request' },
        { status: 403 }
      )
    }

    // Check if wanted request is in renewable status
    if (!['active', 'paused'].includes(wantedRequest.status)) {
      return NextResponse.json(
        { error: 'Only active or paused wanted requests can be renewed' },
        { status: 400 }
      )
    }

    // Check if 18 days have passed since posted date
    const postedDate = new Date(wantedRequest.posted_date)
    const now = new Date()
    const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSincePosted < 18) {
      return NextResponse.json(
        { error: `You can renew this wanted request in ${18 - daysSincePosted} days` },
        { status: 400 }
      )
    }

    // Update the wanted request's posted_date to now and ensure it's active
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        posted_date: now.toISOString(),
        updated_at: now.toISOString(),
        status: 'active',  // Ensure it's active after renewal
        pause_date: null   // Clear any pause date
      })
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error('Error renewing wanted request', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to renew wanted request' },
        { status: 500 }
      )
    }

    // Log the renewal action
    const { error: logError } = await supabase
      .from('wanted_request_actions')
      .insert({
        wanted_request_id: requestId,
        user_id: user.id,
        action: 'renewed',
        created_at: now.toISOString()
      })
    
    if (logError) {
      logger.error('Failed to log renewal action', logError as Error)
    }

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: 'Wanted request renewed successfully! It will now appear at the top of search results.'
    })
    
  } catch (error) {
    logger.error('Error in renew wanted request endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
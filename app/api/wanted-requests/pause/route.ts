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

    // Get wanted request ID and action from request body
    const { requestId, action } = await request.json()
    
    if (!requestId || !action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Wanted request ID and valid action (pause/resume) are required' },
        { status: 400 }
      )
    }

    // First, check if the wanted request belongs to the user
    const { data: wantedRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('user_id, status')
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
        { error: 'You do not have permission to modify this wanted request' },
        { status: 403 }
      )
    }

    const now = new Date()
    let updateData: any = {
      updated_at: now.toISOString()
    }

    if (action === 'pause') {
      // Check if request is already paused
      if (wantedRequest.status === 'paused') {
        return NextResponse.json(
          { error: 'Wanted request is already paused' },
          { status: 400 }
        )
      }

      // Check if request can be paused (must be active)
      if (wantedRequest.status !== 'active') {
        return NextResponse.json(
          { error: 'Only active wanted requests can be paused' },
          { status: 400 }
        )
      }

      updateData.status = 'paused'
    } else { // resume
      // Check if request is currently paused
      if (wantedRequest.status !== 'paused') {
        return NextResponse.json(
          { error: 'Only paused wanted requests can be resumed' },
          { status: 400 }
        )
      }

      updateData.status = 'active'
    }

    // Update the wanted request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update(updateData)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error(`Error ${action}ing wanted request`, updateError as Error)
      return NextResponse.json(
        { error: `Failed to ${action} wanted request` },
        { status: 500 }
      )
    }

    // Note: wanted_request_actions table does not exist in database
    // Action logging removed until table is created via migration

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: `Wanted request ${action}d successfully!`
    })
    
  } catch (error) {
    logger.error('Error in pause/resume wanted request endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
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
      .select('user_id, status, posted_date, pause_date')
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
      updateData.pause_date = now.toISOString()
    } else { // resume
      // Check if request is currently paused
      if (wantedRequest.status !== 'paused') {
        return NextResponse.json(
          { error: 'Only paused wanted requests can be resumed' },
          { status: 400 }
        )
      }

      updateData.status = 'active'
      updateData.pause_date = null
      // Note: We don't update posted_date for resume (unlike renew)
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
      console.error(`Error ${action}ing wanted request:`, updateError)
      return NextResponse.json(
        { error: `Failed to ${action} wanted request` },
        { status: 500 }
      )
    }

    // Log the action
    const { error: logError } = await supabase
      .from('wanted_request_actions')
      .insert({
        wanted_request_id: requestId,
        user_id: user.id,
        action: action === 'pause' ? 'paused' : 'resumed',
        created_at: now.toISOString()
      })
    
    if (logError) {
      console.error(`Failed to log ${action} action:`, logError)
    }

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: `Wanted request ${action}d successfully!`
    })
    
  } catch (error) {
    console.error('Error in pause/resume wanted request endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
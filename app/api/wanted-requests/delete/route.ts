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

    // Get wanted request ID from request body
    const { requestId } = await request.json()
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Wanted request ID is required' },
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
        { error: 'You do not have permission to delete this wanted request' },
        { status: 403 }
      )
    }

    // Check if request is already deleted
    if (wantedRequest.status === 'deleted') {
      return NextResponse.json(
        { error: 'Wanted request is already deleted' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update the wanted request status to deleted (soft delete)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        status: 'deleted',
        deleted_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error deleting wanted request:', updateError)
      return NextResponse.json(
        { error: 'Failed to delete wanted request' },
        { status: 500 }
      )
    }

    // Log the deletion action
    const { error: logError } = await supabase
      .from('wanted_request_actions')
      .insert({
        wanted_request_id: requestId,
        user_id: user.id,
        action: 'deleted',
        created_at: now.toISOString()
      })
    
    if (logError) {
      console.error('Failed to log deletion action:', logError)
    }

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: 'Wanted request moved to bin successfully!'
    })
    
  } catch (error) {
    console.error('Error in delete wanted request endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PUT(request: NextRequest) {
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

    // Get wanted request data from request body
    const { requestId, ...updateData } = await request.json()
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Wanted request ID is required' },
        { status: 400 }
      )
    }

    // First, check if the wanted request belongs to the user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Wanted request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingRequest.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this wanted request' },
        { status: 403 }
      )
    }

    const now = new Date()

    // Prepare update data
    const updatePayload = {
      ...updateData,
      updated_at: now.toISOString()
    }

    // If this is a resubmission (from deleted status), set to pending
    if (existingRequest.status === 'deleted') {
      updatePayload.status = 'pending'
      updatePayload.resubmitted_at = now.toISOString()
    }

    // Update the wanted request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating wanted request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update wanted request' },
        { status: 500 }
      )
    }

    // Log the action
    const actionType = existingRequest.status === 'deleted' ? 'resubmitted' : 'updated'
    await supabase
      .from('wanted_request_actions')
      .insert({
        wanted_request_id: requestId,
        user_id: user.id,
        action: actionType,
        created_at: now.toISOString()
      })
      .catch(err => console.error('Failed to log update action:', err))

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: existingRequest.status === 'deleted' 
        ? 'Wanted request resubmitted successfully! It will be reviewed by our team.'
        : 'Wanted request updated successfully!'
    })
    
  } catch (error) {
    console.error('Error in update wanted request endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
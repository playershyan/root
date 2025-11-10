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
        { error: 'You do not have permission to close this wanted request' },
        { status: 403 }
      )
    }

    // Check if request is already closed/fulfilled
    if (wantedRequest.status === 'fulfilled') {
      return NextResponse.json(
        { error: 'Wanted request is already closed' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update the wanted request status to fulfilled (closed)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        status: 'fulfilled',
        updated_at: now.toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error('Error closing wanted request', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to close wanted request' },
        { status: 500 }
      )
    }

    // Note: wanted_request_actions table does not exist in database
    // Action logging removed until table is created via migration

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: 'Wanted request closed successfully!'
    })
    
  } catch (error) {
    logger.error('Error in close wanted request endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
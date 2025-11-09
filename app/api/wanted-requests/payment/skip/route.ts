import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { requestId } = body

    // Validate request body
    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify the wanted request belongs to the user
    const { data: wantedRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('id, user_id')
      .eq('id', requestId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !wantedRequest) {
      return NextResponse.json(
        { error: 'Wanted request not found' },
        { status: 404 }
      )
    }

    // Update the wanted request to activate as regular (non-high-priority)
    // is_active = true, status = 'pending' (awaiting admin approval)
    // is_high_priority remains false (default)
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        is_active: true,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating wanted request', updateError, { requestId, userId: user.id })
      return NextResponse.json(
        { error: 'Failed to update wanted request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Request published as regular (pending admin approval)'
    })

  } catch (error) {
    logger.error('Skip payment error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

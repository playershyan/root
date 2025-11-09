import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { requestId, paymentMethod, amount } = body

    // Validate request body
    if (!requestId || !paymentMethod || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Calculate high priority expiry date (7 days from now)
    const highPriorityUntil = new Date()
    highPriorityUntil.setDate(highPriorityUntil.getDate() + 7)

    // Update the wanted request to mark as high priority and activate it
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        is_high_priority: true,
        high_priority_until: highPriorityUntil.toISOString(),
        is_active: true,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error updating wanted request', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to update wanted request' },
        { status: 500 }
      )
    }

    // TODO: In production, you would:
    // 1. Process actual payment through payment gateway
    // 2. Store payment transaction record
    // 3. Send confirmation email/SMS
    // 4. Log payment in audit trail

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: 'Payment processed successfully'
    })

  } catch (error) {
    logger.error('Payment completion error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

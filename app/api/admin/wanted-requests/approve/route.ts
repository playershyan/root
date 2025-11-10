import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { incr } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for admin actions
    const rateLimitResponse = await withRateLimit(request, rateLimiters.admin)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.hasPermission('moderate_listings')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { requestId, approvalNotes } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // Get the wanted request details first
    const { data: wantedRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('user_id, title')
      .eq('id', requestId)
      .single()

    if (fetchError || !wantedRequest) {
      return NextResponse.json({ error: 'Wanted request not found' }, { status: 404 })
    }

    // Update wanted request status to active and set approval info
    const { error: updateError } = await supabase
      .from('wanted_requests')
      .update({
        status: 'active',
        is_active: true,
        approved_by: (authResult.adminUser as any).user_id,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      logger.error('Error approving wanted request', updateError as Error)
      return NextResponse.json({ error: 'Failed to approve wanted request' }, { status: 500 })
    }

    // Create notification for the user
    if (wantedRequest.user_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: wantedRequest.user_id,
          type: 'wanted_request_approved',
          title: 'Wanted Request Approved',
          message: `Your wanted request "${wantedRequest.title}" has been approved and is now live.${approvalNotes ? ` Admin notes: ${approvalNotes}` : ''}`,
          wanted_request_id: requestId
        })

      if (notificationError) {
        logger.error('Error creating notification', notificationError as Error)
      }
    }

    // Log admin activity
    const { error: logError } = await supabase.rpc('log_admin_activity', {
      p_admin_id: authResult.user.id,
      p_action_type: 'approve_wanted_request',
      p_details: {
        request_id: requestId,
        approval_notes: approvalNotes,
        affected_table: 'wanted_requests'
      },
      p_affected_table: 'wanted_requests',
      p_affected_record_id: requestId
    })

    if (logError) {
      logger.error('Error logging activity', logError as Error)
    }

    incr('admin.wanted_request.approved')

    return NextResponse.json({
      success: true,
      message: 'Wanted request approved successfully',
      request: {
        id: requestId,
        status: 'active',
        is_active: true
      }
    })

  } catch (error) {
    logger.error('Approve wanted request error', error as Error)
    incr('admin.wanted_request.approve.error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
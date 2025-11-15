import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

export async function POST(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('moderate_listings')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = getServiceRoleClient()
    const { requestId, reason, permanent = false } = await request.json()

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: 'Deletion reason is required' }, { status: 400 })
    }

    // Get the wanted request details first
    const { data: wantedRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !wantedRequest) {
      return NextResponse.json({ error: 'Wanted request not found' }, { status: 404 })
    }

    if (permanent) {
      // Permanent deletion - save to deletion log first
      const { error: deletionLogError } = await supabase
        .from('deletion_logs')
        .insert({
          table_name: 'wanted_requests',
          record_id: requestId,
          user_id: wantedRequest.user_id,
          deletion_reason: reason,
          record_data: wantedRequest,
          deleted_at: wantedRequest.deleted_at || new Date().toISOString()
        })

      if (deletionLogError) {
        logger.error('Error logging deletion', deletionLogError as Error)
      }

      // Delete permanently
      const { error: deleteError } = await supabase
        .from('wanted_requests')
        .delete()
        .eq('id', requestId)

      if (deleteError) {
        logger.error('Error deleting wanted request', deleteError as Error)
        return NextResponse.json({ error: 'Failed to delete wanted request' }, { status: 500 })
      }
    } else {
      // Soft delete
      const { error: updateError } = await supabase
        .from('wanted_requests')
        .update({
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          deletion_reason: reason,
          permanently_deleted: false
        })
        .eq('id', requestId)

      if (updateError) {
        logger.error('Error deleting wanted request', updateError as Error)
        return NextResponse.json({ error: 'Failed to delete wanted request' }, { status: 500 })
      }
    }

    // Create notification for the user if soft delete
    if (!permanent && wantedRequest.user_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: wantedRequest.user_id,
          type: 'wanted_request_reported_takedown',
          title: 'Wanted Request Removed',
          message: `Your wanted request "${wantedRequest.title}" has been removed. Reason: ${reason}`,
          wanted_request_id: requestId
        })

      if (notificationError) {
        logger.error('Error creating notification', notificationError as Error)
      }
    }

    // Log admin activity
    const { error: logError } = await supabase.rpc('log_admin_activity', {
      p_admin_id: authResult.user.id,
      p_action_type: permanent ? 'permanently_delete_wanted_request' : 'delete_wanted_request',
      p_details: {
        request_id: requestId,
        deletion_reason: reason,
        permanent: permanent,
        affected_table: 'wanted_requests'
      },
      p_affected_table: 'wanted_requests',
      p_affected_record_id: requestId
    })

    if (logError) {
      logger.error('Error logging activity', logError as Error)
    }

    return NextResponse.json({
      success: true,
      message: `Wanted request ${permanent ? 'permanently' : ''} deleted successfully`
    })

  } catch (error) {
    logger.error('Delete wanted request error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
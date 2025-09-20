import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('view_dashboard')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get recent activity using the function
    const { data: activities, error } = await supabase
      .rpc('get_recent_admin_activity', { p_limit: 20 })

    if (error) {
      // Fallback to manual query
      const { data: fallbackData } = await supabase
        .from('admin_activity_log')
        .select(`
          id,
          action_type,
          action_details,
          affected_table,
          affected_record_id,
          performed_at,
          admin_user_id
        `)
        .order('performed_at', { ascending: false })
        .limit(20)

      const formattedActivities = fallbackData?.map(activity => ({
        id: activity.id,
        type: mapActivityType(activity.action_type),
        title: getActivityTitle(activity.action_type),
        description: getActivityDescription(activity),
        timestamp: activity.performed_at,
        user: 'Admin',
      })) || []

      return NextResponse.json({ activities: formattedActivities })
    }

    const formattedActivities = activities?.map((activity: any) => ({
      id: activity.id,
      type: mapActivityType(activity.action_type),
      title: getActivityTitle(activity.action_type),
      description: getActivityDescription(activity),
      timestamp: activity.performed_at,
      user: activity.admin_email || 'Admin',
    })) || []

    return NextResponse.json({ activities: formattedActivities })

  } catch (error) {
    console.error('Get recent activity error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function mapActivityType(actionType: string): string {
  const typeMap: { [key: string]: string } = {
    'listing_approved': 'listing_approved',
    'listing_rejected': 'listing_rejected',
    'user_banned': 'user_banned',
    'report_resolved': 'report_resolved',
    'login': 'user_login',
    'approve_wanted_request': 'wanted_request_approved',
    'reject_wanted_request': 'wanted_request_rejected',
    'delete_wanted_request': 'wanted_request_deleted',
    'permanently_delete_wanted_request': 'wanted_request_permanently_deleted',
  }
  return typeMap[actionType] || 'other'
}

function getActivityTitle(actionType: string): string {
  const titles: { [key: string]: string } = {
    'listing_approved': 'Listing Approved',
    'listing_rejected': 'Listing Rejected',
    'user_banned': 'User Banned',
    'report_resolved': 'Report Resolved',
    'login': 'Admin Login',
    'view_stats': 'Viewed Statistics',
    'approve_wanted_request': 'Wanted Request Approved',
    'reject_wanted_request': 'Wanted Request Rejected',
    'delete_wanted_request': 'Wanted Request Deleted',
    'permanently_delete_wanted_request': 'Wanted Request Permanently Deleted',
  }
  return titles[actionType] || 'Admin Activity'
}

function getActivityDescription(activity: any): string {
  const details = activity.action_details || {}

  switch (activity.action_type) {
    case 'listing_approved':
      return `Approved listing ${activity.affected_record_id?.slice(0, 8)}...`
    case 'listing_rejected':
      return `Rejected listing with reason: ${details.reason || 'N/A'}`
    case 'user_banned':
      return `Banned user ${activity.affected_record_id?.slice(0, 8)}...`
    case 'report_resolved':
      return `Resolved report ${activity.affected_record_id?.slice(0, 8)}...`
    case 'login':
      return 'Logged into admin dashboard'
    case 'view_stats':
      return 'Viewed dashboard statistics'
    case 'approve_wanted_request':
      return `Approved wanted request ${activity.affected_record_id?.slice(0, 8)}...`
    case 'reject_wanted_request':
      return `Rejected wanted request with reason: ${details.rejection_reason || 'N/A'}`
    case 'delete_wanted_request':
      return `Deleted wanted request ${activity.affected_record_id?.slice(0, 8)}...`
    case 'permanently_delete_wanted_request':
      return `Permanently deleted wanted request ${activity.affected_record_id?.slice(0, 8)}...`
    default:
      return `Performed ${activity.action_type}`
  }
}
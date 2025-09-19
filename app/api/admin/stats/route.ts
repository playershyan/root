import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const hasPermission = authResult.hasPermission('view_dashboard')
  if (!hasPermission) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Try to use the new calculate_dashboard_metrics function
    const { data: metrics, error: metricsError } = await supabase
      .rpc('calculate_dashboard_metrics')

    if (!metricsError && metrics) {
      // Log admin activity
      await supabase.rpc('log_admin_activity', {
        p_admin_id: authResult.user.id,
        p_action_type: 'view_stats',
        p_details: { endpoint: '/api/admin/stats', method: 'function' }
      })

      return NextResponse.json({
        totalUsers: metrics.total_users || 0,
        activeListings: metrics.active_listings || 0,
        pendingListings: metrics.pending_listings || 0,
        pendingReports: metrics.pending_reports || 0,
        todayListings: metrics.new_listings || 0,
        todayUsers: metrics.new_users || 0,
        pendingBusinessProfiles: metrics.pending_business || 0,
        verifiedBusinessProfiles: metrics.verified_business || 0
      })
    }

    // Fallback to manual calculation
    const [
      pendingListings,
      activeListings,
      totalUsers,
      pendingReports,
      todayListings,
      todayUsers,
      pendingBusinessProfiles,
      verifiedBusinessProfiles
    ] = await Promise.all([
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_active', true),

      supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
    ])

    const stats = {
      totalUsers: totalUsers.count || 0,
      activeListings: activeListings.count || 0,
      pendingListings: pendingListings.count || 0,
      pendingReports: pendingReports.count || 0,
      todayListings: todayListings.count || 0,
      todayUsers: todayUsers.count || 0,
      pendingBusinessProfiles: pendingBusinessProfiles.count || 0,
      verifiedBusinessProfiles: verifiedBusinessProfiles.count || 0
    }

    // Log admin activity
    await supabase.rpc('log_admin_activity', {
      p_admin_id: authResult.user.id,
      p_action_type: 'view_stats',
      p_details: { endpoint: '/api/admin/stats', method: 'fallback' }
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('admin.stats.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/admin/stats')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/admin/stats', durationMs)
    performanceMonitor.incrementCounter(`admin.stats.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/admin/stats', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/admin/stats', new Error(reason), logContext)
    }

    return response
  }

  const timed = async <T>(
    label: string,
    operation: () => Promise<T>,
    context: Record<string, any> = {}
  ): Promise<T> => {
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      logger.db.query(label, { durationMs: Math.round(duration), ...context })
      performanceMonitor.trackDatabaseQuery(label, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.db.query(label, { durationMs: Math.round(duration), status: 'error', ...context })
      performanceMonitor.trackDatabaseQuery(label, duration)
      throw error
    }
  }

  // Verify admin access
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return finish('failure', authResult, { reason: 'admin-auth-failed' })
  }

  const hasPermission = authResult.hasPermission('view_dashboard')
  if (!hasPermission) {
    return finish(
      'failure',
      NextResponse.json({ error: 'Permission denied' }, { status: 403 }),
      { reason: 'permission-denied', adminId: authResult.user.id }
    )
  }

  try {
    const supabase = getServiceRoleClient()

    // Try to use the new calculate_dashboard_metrics function
    const { data: metrics, error: metricsError } = await timed(
      'rpc.calculate_dashboard_metrics',
      () => supabase.rpc('calculate_dashboard_metrics'),
      { adminId: authResult.user.id }
    )

    if (!metricsError && metrics) {
      // Log admin activity
      await timed('rpc.log_admin_activity', () =>
        supabase.rpc('log_admin_activity', {
          p_admin_id: authResult.user.id,
          p_action_type: 'view_stats',
          p_details: { endpoint: '/api/admin/stats', method: 'function' }
        }),
        { adminId: authResult.user.id, method: 'function' }
      )

      return finish('success', NextResponse.json({
        totalUsers: metrics.total_users || 0,
        activeListings: metrics.active_listings || 0,
        pendingListings: metrics.pending_listings || 0,
        pendingReports: metrics.pending_reports || 0,
        todayListings: metrics.new_listings || 0,
        todayUsers: metrics.new_users || 0,
        pendingBusinessProfiles: metrics.pending_business || 0,
        verifiedBusinessProfiles: metrics.verified_business || 0,
        activeWantedRequests: metrics.active_wanted_requests || 0,
        pendingWantedRequests: metrics.pending_wanted_requests || 0,
        todayWantedRequests: metrics.new_wanted_requests || 0
      }), {
        adminId: authResult.user.id,
        source: 'function'
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
      verifiedBusinessProfiles,
      activeWantedRequests,
      pendingWantedRequests,
      todayWantedRequests
    ] = await Promise.all([
      timed('listings.count_pending', () => supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'), { status: 'pending' }),

      timed('listings.count_active', () => supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'), { status: 'active' }),

      timed('profiles.count_all', () => supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }), {}),

      timed('reports.count_pending', () => supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'), { status: 'pending' }),

      timed('listings.count_today', () => supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()), {}),

      timed('profiles.count_today', () => supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()), {}),

      timed('business_profiles.count_pending', () => supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_active', true), {}),

      timed('business_profiles.count_verified', () => supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true), {}),

      timed('wanted_requests.count_active', () => supabase
        .from('wanted_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'), {}),

      timed('wanted_requests.count_pending', () => supabase
        .from('wanted_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('approved_at', null), { type: 'pendingApproval' }),

      timed('wanted_requests.count_today', () => supabase
        .from('wanted_requests')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()), {})
    ])

    const stats = {
      totalUsers: totalUsers.count || 0,
      activeListings: activeListings.count || 0,
      pendingListings: pendingListings.count || 0,
      pendingReports: pendingReports.count || 0,
      todayListings: todayListings.count || 0,
      todayUsers: todayUsers.count || 0,
      pendingBusinessProfiles: pendingBusinessProfiles.count || 0,
      verifiedBusinessProfiles: verifiedBusinessProfiles.count || 0,
      activeWantedRequests: activeWantedRequests.count || 0,
      pendingWantedRequests: pendingWantedRequests.count || 0,
      todayWantedRequests: todayWantedRequests.count || 0
    }

    // Log admin activity
    await timed('rpc.log_admin_activity', () =>
      supabase.rpc('log_admin_activity', {
        p_admin_id: authResult.user.id,
        p_action_type: 'view_stats',
        p_details: { endpoint: '/api/admin/stats', method: 'fallback' }
      }),
      { adminId: authResult.user.id, method: 'fallback' }
    )

    return finish('success', NextResponse.json(stats), {
      adminId: authResult.user.id,
      source: 'fallback'
    })

  } catch (error) {
    logger.error('Get admin stats error', error as Error)
    return finish(
      'failure',
      NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
      { reason: (error as Error).message, adminId: authResult.user.id }
    )
  }
}
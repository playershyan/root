import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'

// GET - Admin cleanup statistics
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const hasPermission = authResult.hasPermission('view_dashboard')
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied - view_dashboard required' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get cleanup statistics from the last 30 days
    const { data: cleanupStats, error: cleanupError } = await supabase
      .from('admin_cleanup_stats')
      .select('*')
      .gte('cleanup_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('cleanup_date', { ascending: false })

    if (cleanupError) {
      logger.error('Error fetching cleanup stats', cleanupError as Error, {
        details: JSON.stringify(cleanupError, null, 2)
      })

      // If table doesn't exist, return empty stats
      if (cleanupError.code === 'PGRST116' || cleanupError.message?.includes('relation') || cleanupError.message?.includes('does not exist')) {
        logger.info('Cleanup stats table not found, using empty stats')
        return NextResponse.json({ 
          summary: {
            totalCleanups: 0,
            totalRecordsDeleted: 0,
            totalStorageFreedMB: 0,
            totalErrors: 0,
            totalBinItemsCleaned: 0,
            totalBinStorageFreedMB: 0,
            averageExecutionTimeMs: 0,
            successRate: 100
          },
          cleanupStats: [],
          recoveryStats: [],
          eligibleRecoveries: [],
          binStats: {
            total_bin_items: 0,
            bin_listings_count: 0,
            bin_wanted_requests_count: 0,
            recent_bin_additions: 0,
            items_expiring_soon: 0,
            avg_days_in_bin: 0,
            total_bin_storage_mb: 0,
            cleanup_stats: {},
            user_activity: {}
          },
          lastUpdated: new Date().toISOString(),
          note: 'Cleanup monitoring system not yet initialized'
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch cleanup statistics',
        details: cleanupError.message || cleanupError
      }, { status: 500 })
    }

    // Get recovery statistics
    const { data: recoveryStats, error: recoveryError } = await supabase
      .from('admin_recovery_stats')
      .select('*')

    if (recoveryError) {
      logger.error('Error fetching recovery stats', recoveryError as Error)
      return NextResponse.json({
        error: 'Failed to fetch recovery statistics'
      }, { status: 500 })
    }

    // Get business profiles eligible for recovery
    const { data: eligibleRecoveries, error: eligibleError } = await supabase
      .from('admin_business_recovery_eligible')
      .select('*')
      .limit(10)

    if (eligibleError) {
      logger.error('Error fetching eligible recoveries', eligibleError as Error)
    }

    // Get bin statistics
    const { data: binStats, error: binError } = await supabase
      .rpc('get_admin_bin_statistics', { days_back: 30 })

    if (binError) {
      logger.error('Error fetching bin stats', binError as Error, {
        details: JSON.stringify(binError, null, 2)
      })
      // Continue execution even if bin stats fail - we'll use default values
    }

    // Calculate summary metrics
    const totalCleanups = cleanupStats?.reduce((sum, stat) => sum + (stat.cleanup_runs || 0), 0) || 0
    const totalRecordsDeleted = cleanupStats?.reduce((sum, stat) => sum + (stat.total_records_deleted || 0), 0) || 0
    const totalStorageFreed = cleanupStats?.reduce((sum, stat) => sum + (stat.total_storage_freed_mb || 0), 0) || 0
    const totalErrors = cleanupStats?.reduce((sum, stat) => sum + (stat.error_count || 0), 0) || 0
    const totalBinItemsCleaned = cleanupStats?.reduce((sum, stat) => sum + (stat.bin_items_deleted || 0), 0) || 0
    const totalBinStorageFreed = cleanupStats?.reduce((sum, stat) => sum + (stat.bin_storage_freed_mb || 0), 0) || 0
    const averageExecutionTime = cleanupStats?.length > 0 
      ? cleanupStats.reduce((sum, stat) => sum + (stat.avg_execution_time_ms || 0), 0) / cleanupStats.length 
      : 0

    return NextResponse.json({
      summary: {
        totalCleanups,
        totalRecordsDeleted,
        totalStorageFreedMB: Math.round(totalStorageFreed * 100) / 100,
        totalErrors,
        totalBinItemsCleaned,
        totalBinStorageFreedMB: Math.round(totalBinStorageFreed * 100) / 100,
        averageExecutionTimeMs: Math.round(averageExecutionTime),
        successRate: totalCleanups > 0 ? Math.round(((totalCleanups - totalErrors) / totalCleanups) * 100) : 100
      },
      cleanupStats: cleanupStats || [],
      recoveryStats: recoveryStats || [],
      eligibleRecoveries: eligibleRecoveries || [],
      binStats: binStats?.[0] || {
        total_bin_items: 0,
        bin_listings_count: 0,
        bin_wanted_requests_count: 0,
        recent_bin_additions: 0,
        items_expiring_soon: 0,
        avg_days_in_bin: 0,
        total_bin_storage_mb: 0,
        cleanup_stats: {},
        user_activity: {}
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in cleanup stats GET', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Trigger manual cleanup (admin only)
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const hasPermission = authResult.hasPermission('manage_cleanup')
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied - manage_cleanup required' }, { status: 403 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const body = await request.json().catch(() => ({}))
    const cleanupType = body.type || 'all' // 'all', 'bin', or 'profiles'

    let result, error, functionName, actionDesc

    if (cleanupType === 'bin') {
      // Trigger bin-only cleanup
      const response = await supabase.rpc('admin_trigger_bin_cleanup')
      result = response.data
      error = response.error
      functionName = 'admin_trigger_bin_cleanup'
      actionDesc = 'bin cleanup'
    } else {
      // Trigger full cleanup (default)
      const response = await supabase.rpc('cleanup_old_deleted_records_monitored')
      result = response.data
      error = response.error
      functionName = 'cleanup_old_deleted_records_monitored'
      actionDesc = 'full cleanup'
    }

    if (error) {
      logger.error(`Error running ${actionDesc}`, error as Error)
      return NextResponse.json({
        error: `Failed to run ${actionDesc}`
      }, { status: 500 })
    }

    // Log admin action
    logger.audit(`Manual ${actionDesc} triggered`, {
      adminEmail: authResult.user.email,
      triggeredAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      result: result,
      cleanupType: cleanupType,
      triggeredBy: authResult.user.email,
      triggeredAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error during manual cleanup', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
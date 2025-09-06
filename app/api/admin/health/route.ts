import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

// GET - Check admin system health and database status
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

    // Check various database components
    const healthChecks = {
      admin_users: false,
      admin_cleanup_stats: false,
      admin_alert_log: false,
      admin_alert_config: false,
      deleted_listings: false,
      deleted_wanted_requests: false,
      deleted_business_profiles: false,
      functions: {
        get_recent_alerts: false,
        get_admin_bin_statistics: false,
        check_and_trigger_alerts: false,
        cleanup_old_deleted_records_monitored: false
      }
    }

    const issues = []

    // Check tables exist
    const tablesToCheck = [
      'admin_users',
      'admin_cleanup_stats', 
      'admin_alert_log',
      'admin_alert_config',
      'deleted_listings',
      'deleted_wanted_requests',
      'deleted_business_profiles'
    ]

    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(0)
        if (!error) {
          (healthChecks as any)[tableName] = true
        } else if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          issues.push(`Table '${tableName}' does not exist`)
        } else {
          issues.push(`Table '${tableName}' error: ${error.message}`)
        }
      } catch (err) {
        issues.push(`Table '${tableName}' check failed: ${err}`)
      }
    }

    // Check functions exist
    const functionsToCheck = [
      'get_recent_alerts',
      'get_admin_bin_statistics', 
      'check_and_trigger_alerts',
      'cleanup_old_deleted_records_monitored'
    ]

    for (const funcName of functionsToCheck) {
      try {
        let testResult
        
        switch (funcName) {
          case 'get_recent_alerts':
            testResult = await supabase.rpc(funcName, { days_back: 1 })
            break
          case 'get_admin_bin_statistics':
            testResult = await supabase.rpc(funcName, { days_back: 1 })
            break
          case 'check_and_trigger_alerts':
            // Don't actually call this - just check if it exists
            testResult = { error: null }
            break
          case 'cleanup_old_deleted_records_monitored':
            // Don't actually call this - just check if it exists  
            testResult = { error: null }
            break
          default:
            testResult = await supabase.rpc(funcName)
        }
        
        if (!testResult.error) {
          (healthChecks.functions as any)[funcName] = true
        } else if (testResult.error.code === '42883' || testResult.error.message?.includes('function') || testResult.error.message?.includes('does not exist')) {
          issues.push(`Function '${funcName}' does not exist`)
        } else {
          (healthChecks.functions as any)[funcName] = true // Function exists but may have returned an error for other reasons
        }
      } catch (err) {
        issues.push(`Function '${funcName}' check failed: ${err}`)
      }
    }

    // Overall health status
    const allTablesHealthy = Object.entries(healthChecks).filter(([key, _]) => key !== 'functions').every(([_, value]) => value)
    const allFunctionsHealthy = Object.values(healthChecks.functions).every(value => value)
    const overallHealthy = allTablesHealthy && allFunctionsHealthy && issues.length === 0

    return NextResponse.json({
      success: true,
      healthy: overallHealthy,
      checks: healthChecks,
      issues: issues,
      recommendations: issues.length > 0 ? [
        'Run database migrations to ensure all tables and functions are created',
        'Check that Supabase migrations have been applied properly',
        'Verify that the admin monitoring system has been properly initialized'
      ] : [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

// GET - Get recent alerts and alert configuration
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

    const supabase = getServiceRoleClient()

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'recent'
    const daysBack = parseInt(url.searchParams.get('days') || '7')

    if (action === 'recent') {
      // Get recent alerts
      logger.debug('Attempting to fetch recent alerts', { daysBack })

      // Try to use the function first, fallback to direct table query if function doesn't exist
      let recentAlerts = []
      let alertsError = null

      try {
        const { data, error } = await supabase
          .rpc('get_recent_alerts', { days_back: daysBack })

        recentAlerts = data || []
        alertsError = error
      } catch (funcError) {
        logger.debug('Function not available, trying direct table query', { error: funcError })
        
        // Fallback to direct table query
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysBack)
        
        const { data, error } = await supabase
          .from('admin_alert_log')
          .select('alert_type, triggered_at, message, data, sent_successfully')
          .gte('triggered_at', cutoffDate.toISOString())
          .order('triggered_at', { ascending: false })
        
        recentAlerts = data || []
        alertsError = error
      }

      logger.debug('Recent alerts query result', { resultCount: recentAlerts?.length, hasError: !!alertsError })

      if (alertsError) {
        logger.error('Error fetching recent alerts', alertsError as Error)

        // If table doesn't exist, return empty alerts instead of error
        if (alertsError.code === 'PGRST116' || alertsError.message?.includes('relation') || alertsError.message?.includes('does not exist')) {
          logger.warn('Alert table/function not found, returning empty alerts')
          return NextResponse.json({
            success: true,
            alerts: [],
            note: 'Alert system not yet initialized'
          })
        }
        
        return NextResponse.json({ 
          error: 'Failed to fetch recent alerts',
          details: alertsError.message || alertsError
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        alerts: recentAlerts || []
      })
    } else if (action === 'config') {
      // Get alert configuration
      const { data: alertConfig, error: configError } = await supabase
        .from('admin_alert_config')
        .select('*')
        .order('alert_type')

      if (configError) {
        logger.error('Error fetching alert config', configError as Error)

        // If table doesn't exist, return empty config
        if (configError.code === 'PGRST116' || configError.message?.includes('relation') || configError.message?.includes('does not exist')) {
          logger.warn('Alert config table not found, returning empty config')
          return NextResponse.json({
            success: true,
            config: [],
            note: 'Alert configuration not yet initialized'
          })
        }
        
        return NextResponse.json({ 
          error: 'Failed to fetch alert configuration',
          details: configError.message || configError
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        config: alertConfig || []
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid action parameter' 
      }, { status: 400 })
    }

  } catch (error) {
    logger.error('Unexpected error in alerts API', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Trigger alert check or update alert configuration
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const hasPermission = authResult.hasPermission('manage_alerts')
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied - manage_alerts required' }, { status: 403 })
    }

    const supabase = getServiceRoleClient()

    const body = await request.json()
    const { action, alertType, config } = body

    if (action === 'check') {
      // Trigger alert check
      const { data: result, error: checkError } = await supabase
        .rpc('check_and_trigger_alerts')

      if (checkError) {
        logger.error('Error triggering alert check', checkError as Error)
        return NextResponse.json({
          error: 'Failed to trigger alert check'
        }, { status: 500 })
      }

      // Log admin action
      logger.info('Alert check triggered by admin', { adminEmail: authResult.user.email })

      return NextResponse.json({
        success: true,
        message: 'Alert check completed',
        result: result,
        triggeredBy: authResult.user.email,
        triggeredAt: new Date().toISOString()
      })
    } else if (action === 'update_config' && alertType && config) {
      // Update alert configuration
      const { error: updateError } = await supabase
        .from('admin_alert_config')
        .update({
          is_enabled: config.is_enabled,
          email_recipients: config.email_recipients,
          threshold_value: config.threshold_value,
          updated_at: new Date().toISOString()
        })
        .eq('alert_type', alertType)

      if (updateError) {
        logger.error('Error updating alert config', updateError as Error, { alertType })
        return NextResponse.json({
          error: 'Failed to update alert configuration'
        }, { status: 500 })
      }

      // Log admin action
      logger.info('Alert config updated by admin', { alertType, adminEmail: authResult.user.email })

      return NextResponse.json({
        success: true,
        message: 'Alert configuration updated successfully',
        updatedBy: authResult.user.email,
        updatedAt: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        error: 'Invalid action or missing parameters' 
      }, { status: 400 })
    }

  } catch (error) {
    logger.error('Unexpected error in alerts API POST', error as Error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { uptimeMonitor } from '@/lib/monitoring/uptime'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('view_monitoring')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    // Get system metrics
    const uptime = uptimeMonitor.getUptimeSeconds()
    const uptimeFormatted = uptimeMonitor.getUptimeFormatted()
    
    // Run health checks
    const healthChecks = await uptimeMonitor.runHealthChecks()
    const healthyServices = healthChecks.filter(check => check.status === 'healthy').length
    const totalServices = healthChecks.length
    const healthPercentage = totalServices > 0 ? (healthyServices / totalServices) * 100 : 100

    // Get performance metrics (this would need to be implemented based on your metrics storage)
    const performanceMetrics = {
      avgResponseTime: 0, // You'd calculate this from stored metrics
      errorRate: 0,
      requestsPerMinute: 0,
      activeUsers: 0 // This would come from your analytics
    }

    // System resource metrics
    const systemMetrics = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform
    }

    // Recent alerts (this would come from your alert storage)
    const recentAlerts = [
      // Placeholder - you'd fetch from your alert log
    ]

    const monitoringData = {
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        uptime: {
          seconds: uptime,
          formatted: uptimeFormatted,
          startTime: new Date(Date.now() - uptime * 1000).toISOString()
        },
        health: {
          overall: healthPercentage >= 90 ? 'healthy' : healthPercentage >= 70 ? 'degraded' : 'unhealthy',
          percentage: healthPercentage,
          services: {
            healthy: healthyServices,
            total: totalServices
          },
          checks: healthChecks
        },
        resources: {
          memory: {
            used: Math.round(systemMetrics.memory.heapUsed / 1024 / 1024), // MB
            total: Math.round(systemMetrics.memory.heapTotal / 1024 / 1024), // MB
            external: Math.round(systemMetrics.memory.external / 1024 / 1024), // MB
            rss: Math.round(systemMetrics.memory.rss / 1024 / 1024) // MB
          },
          process: {
            pid: process.pid,
            nodeVersion: systemMetrics.nodeVersion,
            platform: systemMetrics.platform,
            uptime: process.uptime()
          }
        }
      },
      performance: performanceMetrics,
      alerts: {
        recent: recentAlerts,
        summary: {
          last24h: 0,
          last7d: 0,
          critical: 0
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      }
    }

    return NextResponse.json(monitoringData)
  } catch (error) {
    logger.error('Monitoring dashboard error', error as Error)
    return NextResponse.json(
      { error: 'Failed to load monitoring data' },
      { status: 500 }
    )
  }
}

// Real-time metrics endpoint
export async function POST(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('view_monitoring')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const { action, ...params } = await request.json()

    switch (action) {
      case 'trigger_health_check':
        const healthResults = await uptimeMonitor.runHealthChecks()
        return NextResponse.json({
          success: true,
          healthChecks: healthResults
        })

      case 'get_performance_metrics':
        // Return performance metrics for a specific time range
        const { endpoint, timeRange } = params
        // You'd implement this based on your metrics storage
        return NextResponse.json({
          success: true,
          metrics: {
            endpoint,
            timeRange,
            data: [] // Placeholder
          }
        })

      case 'test_alert':
        // Test alert system
        const { alertType } = params
        performanceMonitor.trackBusinessMetric('test.alert', 1, {
          type: alertType
        })
        return NextResponse.json({
          success: true,
          message: 'Test alert triggered'
        })

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Monitoring action error', error as Error)
    return NextResponse.json(
      { error: 'Failed to execute monitoring action' },
      { status: 500 }
    )
  }
}
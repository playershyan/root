import { NextResponse } from 'next/server'
import { uptimeMonitor } from '@/lib/monitoring/uptime'
import { performanceMonitor } from '@/lib/monitoring/metrics'

export async function GET() {
  const startTime = Date.now()

  try {
    // Run comprehensive health checks using the monitoring system
    const healthResults = await uptimeMonitor.runHealthChecks()
    const uptime = uptimeMonitor.getUptimeSeconds()
    const uptimeFormatted = uptimeMonitor.getUptimeFormatted()

    // Convert health check results to the expected format
    const checks: Record<string, string> = {}
    let overallHealthy = true

    for (const result of healthResults) {
      checks[result.name] = result.status === 'healthy' ? 'healthy' : 'unhealthy'
      if (result.status !== 'healthy') {
        overallHealthy = false
      }
    }

    // Add API health (always healthy if we reach this point)
    checks.api = 'healthy'

    const response = {
      timestamp: new Date().toISOString(),
      status: overallHealthy ? 'healthy' : 'unhealthy',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        seconds: uptime,
        formatted: uptimeFormatted
      },
      checks,
      responseTime: Date.now() - startTime
    }

    // Track the health check in metrics
    performanceMonitor.trackApiResponseTime('/api/health', response.responseTime)
    performanceMonitor.trackBusinessMetric('health_checks.performed', 1)

    const statusCode = response.status === 'healthy' ? 200 : 503

    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    performanceMonitor.trackError(error as Error, {
      tags: { context: 'health_check' }
    })
    
    const response = {
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      error: 'Internal health check error',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime
    }

    return NextResponse.json(response, { status: 503 })
  }
}
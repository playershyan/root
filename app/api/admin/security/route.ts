/**
 * Security monitoring endpoint for admin dashboard
 * Demonstrates usage of the new security system
 */

import { NextRequest, NextResponse } from 'next/server'
import { securityMiddleware } from '@/lib/security/security-middleware'
import { securityMonitor } from '@/lib/monitoring/security-monitoring'

export async function GET(request: NextRequest) {
  // Apply comprehensive security checks
  const securityCheck = await securityMiddleware(request, {
    endpoint: '/api/admin/security',
    rateLimit: 'admin',
    requireAuth: true,
    requireCaptcha: false, // Admin users don't need CAPTCHA
  })
  
  if (securityCheck) {
    return securityCheck
  }

  try {
    // Get security metrics and health status
    const healthStatus = securityMonitor.getHealthStatus()
    const recentMetrics = securityMonitor.getMetrics(
      new Date(Date.now() - 60 * 60 * 1000) // Last hour
    )
    const alerts = securityMonitor.getAlerts()

    return NextResponse.json({
      health: healthStatus,
      metrics: recentMetrics,
      alerts: alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
        systemStatus: healthStatus.status,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      }
    })

  } catch (error) {
    console.error('Security monitoring error:', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve security data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Apply security checks
  const securityCheck = await securityMiddleware(request, {
    endpoint: '/api/admin/security',
    rateLimit: 'admin',
    requireAuth: true,
  })
  
  if (securityCheck) {
    return securityCheck
  }

  try {
    const { action, alertId } = await request.json()

    switch (action) {
      case 'acknowledge_alert':
        if (alertId) {
          const success = securityMonitor.acknowledgeAlert(alertId)
          return NextResponse.json({ success })
        }
        break
      
      case 'test_alert':
        // Create a test alert for demonstration
        securityMonitor.recordEvent('rate_limit', {
          test: true,
          ip: '127.0.0.1',
          endpoint: '/api/test',
        })
        return NextResponse.json({ success: true, message: 'Test event recorded' })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Security action error:', error)
    
    return NextResponse.json(
      { error: 'Failed to process security action' },
      { status: 500 }
    )
  }
}
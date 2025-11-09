/**
 * Security monitoring and alerting system
 * Tracks anomalies, security events, and performance metrics
 */

import { supabase } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'

export interface SecurityMetrics {
  rateLimitViolations: number
  captchaFailures: number
  payloadSizeViolations: number
  authFailures: number
  quarantinedIPs: number
  errorRate: number
  responseTime: number
  timestamp: Date
}

export interface SecurityAlert {
  id: string
  type: 'rate_limit_spike' | 'captcha_failures' | 'error_spike' | 'slow_response' | 'ddos_pattern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  metadata: Record<string, any>
  timestamp: Date
  acknowledged: boolean
}

/**
 * In-memory metrics storage (would use Redis in production)
 */
class MetricsCollector {
  private metrics: SecurityMetrics[] = []
  private alerts: SecurityAlert[] = []
  private readonly maxMetrics = 1000
  private readonly maxAlerts = 100
  
  // Thresholds for alerting
  private readonly thresholds = {
    rateLimitViolationsPerMinute: 50,
    captchaFailuresPerMinute: 20,
    errorRatePercent: 10,
    responseTimeMs: 5000,
    quarantinedIPsCount: 10,
  }

  /**
   * Record a security event
   */
  recordEvent(type: string, metadata?: Record<string, any>): void {
    const now = new Date()
    const currentMetrics = this.getCurrentMetrics()
    
    switch (type) {
      case 'rate_limit':
        currentMetrics.rateLimitViolations++
        break
      case 'captcha_fail':
        currentMetrics.captchaFailures++
        break
      case 'payload_size':
        currentMetrics.payloadSizeViolations++
        break
      case 'auth_fail':
        currentMetrics.authFailures++
        break
      case 'quarantine':
        currentMetrics.quarantinedIPs++
        break
    }
    
    // Check for anomalies
    this.checkAnomalies(currentMetrics)
    
    // Log to structured logger for external monitoring
    logger.info('SECURITY_METRIC', {
      type,
      metadata,
      timestamp: now.toISOString()
    })
  }

  /**
   * Record response metrics
   */
  recordResponse(success: boolean, responseTime: number): void {
    const currentMetrics = this.getCurrentMetrics()
    
    if (!success) {
      currentMetrics.errorRate = this.calculateErrorRate()
    }
    
    // Update average response time
    currentMetrics.responseTime = 
      (currentMetrics.responseTime + responseTime) / 2
    
    this.checkAnomalies(currentMetrics)
  }

  /**
   * Get current metrics window
   */
  private getCurrentMetrics(): SecurityMetrics {
    const now = new Date()
    const oneMinuteAgo = new Date(now.getTime() - 60000)
    
    // Find or create metrics for current minute
    let current = this.metrics.find(m => m.timestamp > oneMinuteAgo)
    
    if (!current) {
      current = {
        rateLimitViolations: 0,
        captchaFailures: 0,
        payloadSizeViolations: 0,
        authFailures: 0,
        quarantinedIPs: 0,
        errorRate: 0,
        responseTime: 0,
        timestamp: now,
      }
      
      this.metrics.push(current)
      
      // Trim old metrics
      if (this.metrics.length > this.maxMetrics) {
        this.metrics = this.metrics.slice(-this.maxMetrics)
      }
    }
    
    return current
  }

  /**
   * Calculate error rate from recent metrics
   */
  private calculateErrorRate(): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000)
    const recentMetrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo)
    
    if (recentMetrics.length === 0) return 0
    
    const totalErrors = recentMetrics.reduce((sum, m) => 
      sum + m.authFailures + m.payloadSizeViolations, 0)
    
    // Assuming 100 requests per metric window (adjust based on actual traffic)
    const estimatedRequests = recentMetrics.length * 100
    
    return (totalErrors / estimatedRequests) * 100
  }

  /**
   * Check for anomalies and create alerts
   */
  private checkAnomalies(metrics: SecurityMetrics): void {
    const alerts: Partial<SecurityAlert>[] = []
    
    // Check rate limit violations
    if (metrics.rateLimitViolations > this.thresholds.rateLimitViolationsPerMinute) {
      alerts.push({
        type: 'rate_limit_spike',
        severity: 'high',
        message: `Rate limit violations spike: ${metrics.rateLimitViolations}/min`,
        metadata: { violations: metrics.rateLimitViolations }
      })
    }
    
    // Check captcha failures
    if (metrics.captchaFailures > this.thresholds.captchaFailuresPerMinute) {
      alerts.push({
        type: 'captcha_failures',
        severity: 'medium',
        message: `High captcha failure rate: ${metrics.captchaFailures}/min`,
        metadata: { failures: metrics.captchaFailures }
      })
    }
    
    // Check error rate
    if (metrics.errorRate > this.thresholds.errorRatePercent) {
      alerts.push({
        type: 'error_spike',
        severity: 'high',
        message: `Error rate spike: ${metrics.errorRate.toFixed(2)}%`,
        metadata: { errorRate: metrics.errorRate }
      })
    }
    
    // Check response time
    if (metrics.responseTime > this.thresholds.responseTimeMs) {
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `Slow response time: ${metrics.responseTime.toFixed(0)}ms`,
        metadata: { responseTime: metrics.responseTime }
      })
    }
    
    // Check quarantined IPs (possible DDoS)
    if (metrics.quarantinedIPs > this.thresholds.quarantinedIPsCount) {
      alerts.push({
        type: 'ddos_pattern',
        severity: 'critical',
        message: `Possible DDoS: ${metrics.quarantinedIPs} IPs quarantined`,
        metadata: { quarantinedIPs: metrics.quarantinedIPs }
      })
    }
    
    // Create alerts
    alerts.forEach(alert => this.createAlert(alert))
  }

  /**
   * Create and store an alert
   */
  private createAlert(alert: Partial<SecurityAlert>): void {
    const fullAlert: SecurityAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: alert.type!,
      severity: alert.severity!,
      message: alert.message!,
      metadata: alert.metadata || {},
      timestamp: new Date(),
      acknowledged: false,
    }
    
    this.alerts.push(fullAlert)
    
    // Trim old alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts)
    }
    
    // Log critical alerts
    if (fullAlert.severity === 'critical' || fullAlert.severity === 'high') {
      logger.error('[SECURITY_ALERT]', new Error(fullAlert.message), fullAlert.metadata)

      // In production, send to external monitoring service
      this.sendToMonitoringService(fullAlert)
    }
  }

  /**
   * Send alert to external monitoring service
   */
  private async sendToMonitoringService(alert: SecurityAlert): Promise<void> {
    try {
      // Store in Supabase for persistence
      await supabase
        .from('security_alerts')
        .insert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metadata: alert.metadata,
          created_at: alert.timestamp,
        })
        .single()
      
      // In production, also send to:
      // - Sentry for error tracking
      // - PagerDuty for critical alerts
      // - Slack for team notifications
      // - Email for admin notifications
    } catch (error) {
      logger.error('Failed to send alert to monitoring service', error as Error)
    }
  }

  /**
   * Get recent metrics
   */
  getMetrics(since?: Date): SecurityMetrics[] {
    if (!since) {
      return [...this.metrics]
    }
    return this.metrics.filter(m => m.timestamp >= since)
  }

  /**
   * Get unacknowledged alerts
   */
  getAlerts(unacknowledgedOnly = true): SecurityAlert[] {
    if (unacknowledgedOnly) {
      return this.alerts.filter(a => !a.acknowledged)
    }
    return [...this.alerts]
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'critical'
    metrics: SecurityMetrics | null
    activeAlerts: number
  } {
    const currentMetrics = this.getCurrentMetrics()
    const activeAlerts = this.alerts.filter(a => !a.acknowledged).length
    const criticalAlerts = this.alerts.filter(
      a => !a.acknowledged && a.severity === 'critical'
    ).length
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (criticalAlerts > 0) {
      status = 'critical'
    } else if (activeAlerts > 5 || currentMetrics.errorRate > 5) {
      status = 'degraded'
    }
    
    return {
      status,
      metrics: currentMetrics,
      activeAlerts,
    }
  }
}

// Export singleton instance
export const securityMonitor = new MetricsCollector()

/**
 * Middleware to track request metrics
 */
export function trackRequestMetrics(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    const startTime = Date.now()
    let success = true
    
    try {
      const response = await handler(req)
      success = response.ok
      return response
    } catch (error) {
      success = false
      throw error
    } finally {
      const responseTime = Date.now() - startTime
      securityMonitor.recordResponse(success, responseTime)
    }
  }
}
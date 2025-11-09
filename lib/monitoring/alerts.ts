import { performanceMonitor } from './metrics'
import { logger } from '@/lib/utils/logger'

// Alert configuration
export interface AlertConfig {
  name: string
  condition: () => boolean | Promise<boolean>
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  cooldown: number // minutes
  actions: AlertAction[]
}

export interface AlertAction {
  type: 'webhook' | 'email' | 'slack' | 'sms'
  target: string
  template?: string
}

// System health alerts
export class AlertManager {
  private static instance: AlertManager
  private alerts: Map<string, { lastTriggered: number; config: AlertConfig }> = new Map()
  private isMonitoring = false

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  // Start monitoring with predefined alerts
  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true

    // Register default alerts
    this.registerDefaultAlerts()

    // Start monitoring loop
    this.monitoringLoop()

    logger.info('Alert monitoring started')
  }

  // Register a new alert
  registerAlert(config: AlertConfig) {
    this.alerts.set(config.name, {
      lastTriggered: 0,
      config
    })
  }

  // Check all alerts
  private async monitoringLoop() {
    const checkInterval = 60000 // 1 minute
    
    setInterval(async () => {
      if (!this.isMonitoring) return
      
      for (const [name, alert] of this.alerts) {
        try {
          const shouldTrigger = await alert.config.condition()
          
          if (shouldTrigger) {
            const now = Date.now()
            const cooldownMs = alert.config.cooldown * 60 * 1000
            
            // Check cooldown
            if (now - alert.lastTriggered > cooldownMs) {
              await this.triggerAlert(alert.config)
              alert.lastTriggered = now
            }
          }
        } catch (error) {
          logger.error(`Error checking alert ${name}`, error as Error)
        }
      }
    }, checkInterval)
  }

  // Trigger an alert
  private async triggerAlert(config: AlertConfig) {
    logger.warn(`ALERT [${config.severity.toUpperCase()}]: ${config.message}`, new Error('Alert triggered'), {
      name: config.name,
      severity: config.severity
    })

    // Track alert in monitoring
    performanceMonitor.trackBusinessMetric('alerts.triggered', 1, {
      name: config.name,
      severity: config.severity
    })

    // Execute alert actions
    for (const action of config.actions) {
      try {
        await this.executeAction(action, config)
      } catch (error) {
        logger.error(`Failed to execute alert action ${action.type}`, error as Error)
      }
    }
  }

  // Execute alert action
  private async executeAction(action: AlertAction, config: AlertConfig) {
    const alertData = {
      name: config.name,
      severity: config.severity,
      message: config.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    }

    switch (action.type) {
      case 'webhook':
        await this.sendWebhook(action.target, alertData)
        break
      
      case 'slack':
        await this.sendSlackAlert(action.target, alertData)
        break
      
      case 'email':
        await this.sendEmailAlert(action.target, alertData)
        break


      default:
        logger.warn(`Unknown alert action type: ${action.type}`, new Error('Unknown action type'))
    }
  }

  private async sendWebhook(url: string, data: any) {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  private async sendSlackAlert(webhookUrl: string, data: any) {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠', 
      high: '🔴',
      critical: '🚨'
    }

    const slackMessage = {
      text: `${severityEmoji[data.severity]} Alert: ${data.name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${severityEmoji[data.severity]} ${data.severity.toUpperCase()} Alert*\n\n*${data.name}*\n${data.message}\n\n*Environment:* ${data.environment}\n*Time:* ${data.timestamp}`
          }
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })
  }

  private async sendEmailAlert(recipient: string, data: any) {
    // Implement email sending logic using your email service
    logger.info('Would send email alert', { recipient, data })
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false
    logger.info('Alert monitoring stopped')
  }

  // Register default system alerts
  private registerDefaultAlerts() {
    // High error rate alert
    this.registerAlert({
      name: 'high_error_rate',
      severity: 'high',
      message: 'High error rate detected in the application',
      cooldown: 15, // 15 minutes
      condition: async () => {
        // Check error rate from metrics
        // This would need to be implemented based on your error tracking
        return false // Placeholder
      },
      actions: [
        {
          type: 'slack',
          target: process.env.SLACK_ALERT_WEBHOOK || ''
        }
      ]
    })

    // Database connection issues
    this.registerAlert({
      name: 'database_connection_issues',
      severity: 'critical',
      message: 'Database connection issues detected',
      cooldown: 5, // 5 minutes
      condition: async () => {
        try {
          // Test database connection
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          )
          
          const { error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
          
          return !!error
        } catch (error) {
          return true
        }
      },
      actions: [
        {
          type: 'slack',
          target: process.env.SLACK_CRITICAL_WEBHOOK || ''
        }
      ]
    })

    // Memory usage alert
    this.registerAlert({
      name: 'high_memory_usage',
      severity: 'medium',
      message: 'High memory usage detected',
      cooldown: 30, // 30 minutes
      condition: () => {
        if (typeof process !== 'undefined') {
          const memUsage = process.memoryUsage()
          const heapUsedMB = memUsage.heapUsed / 1024 / 1024
          return heapUsedMB > 500 // Alert if using more than 500MB
        }
        return false
      },
      actions: [
        {
          type: 'slack',
          target: process.env.SLACK_ALERT_WEBHOOK || ''
        }
      ]
    })

    // API response time alert
    this.registerAlert({
      name: 'slow_api_responses',
      severity: 'medium',
      message: 'API response times are higher than normal',
      cooldown: 20, // 20 minutes
      condition: () => {
        // Check if any API endpoint has high average response time
        const performanceMonitor = require('./metrics').performanceMonitor
        // This would need access to the metrics data
        return false // Placeholder
      },
      actions: [
        {
          type: 'slack',
          target: process.env.SLACK_ALERT_WEBHOOK || ''
        }
      ]
    })
  }
}

// Create and export singleton
export const alertManager = AlertManager.getInstance()

// Initialize monitoring if in production
if (process.env.NODE_ENV === 'production') {
  alertManager.startMonitoring()
}
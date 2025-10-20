// Uptime monitoring and health checks
export class UptimeMonitor {
  private static instance: UptimeMonitor
  private startTime: number
  private healthChecks: Map<string, HealthCheck> = new Map()
  private isMonitoring = false

  constructor() {
    this.startTime = Date.now()
  }

  static getInstance(): UptimeMonitor {
    if (!UptimeMonitor.instance) {
      UptimeMonitor.instance = new UptimeMonitor()
    }
    return UptimeMonitor.instance
  }

  // Get system uptime in seconds
  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  // Get formatted uptime
  getUptimeFormatted(): string {
    const seconds = this.getUptimeSeconds()
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Register a health check
  registerHealthCheck(name: string, check: HealthCheck) {
    this.healthChecks.set(name, check)
  }

  // Run all health checks
  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []

    for (const [name, check] of this.healthChecks) {
      const startTime = Date.now()
      let result: HealthCheckResult

      try {
        const isHealthy = await Promise.race([
          check.check(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), check.timeout || 5000)
          )
        ])

        result = {
          name,
          status: isHealthy ? 'healthy' : 'unhealthy',
          responseTime: Date.now() - startTime,
          message: isHealthy ? 'OK' : 'Check failed',
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        result = {
          name,
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }

      results.push(result)
    }

    return results
  }

  // Start continuous monitoring
  startMonitoring(intervalMs: number = 60000) {
    if (this.isMonitoring) return

    this.isMonitoring = true

    setInterval(async () => {
      if (!this.isMonitoring) return

      const results = await this.runHealthChecks()
      const unhealthyChecks = results.filter(r => r.status === 'unhealthy')

      if (unhealthyChecks.length > 0) {
        console.warn('🔴 Unhealthy services detected:', unhealthyChecks.map(c => c.name))
        
        // Send alerts for unhealthy services
        for (const check of unhealthyChecks) {
          await this.sendUptimeAlert(check)
        }
      }

      // Log uptime statistics
      this.logUptimeStats(results)
    }, intervalMs)

    console.log('📊 Uptime monitoring started')
  }

  // Stop monitoring
  stopMonitoring() {
    this.isMonitoring = false
    console.log('⏹️ Uptime monitoring stopped')
  }

  // Register default health checks
  registerDefaultHealthChecks() {
    // Database connectivity
    this.registerHealthCheck('database', {
      timeout: 5000,
      check: async () => {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          )
          
          const { error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1)
          
          return !error
        } catch (error) {
          return false
        }
      }
    })

    // External API connectivity (example)
    this.registerHealthCheck('external_api', {
      timeout: 3000,
      check: async () => {
        try {
          // Example external service check
          const response = await fetch('https://httpstat.us/200', {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          })
          return response.ok
        } catch (error) {
          return false
        }
      }
    })

    // Memory usage check
    this.registerHealthCheck('memory', {
      timeout: 1000,
      check: async () => {
        if (typeof process !== 'undefined') {
          const memUsage = process.memoryUsage()
          const heapUsedMB = memUsage.heapUsed / 1024 / 1024
          return heapUsedMB < 1000 // Less than 1GB
        }
        return true
      }
    })

    // Disk space check (if available)
    this.registerHealthCheck('disk_space', {
      timeout: 2000,
      check: async () => {
        // This would require fs access and is more relevant for self-hosted environments
        return true // Placeholder - always healthy for cloud deployments
      }
    })
  }

  private async sendUptimeAlert(result: HealthCheckResult) {
    const alertData = {
      type: 'uptime_alert',
      service: result.name,
      status: result.status,
      message: result.message,
      responseTime: result.responseTime,
      timestamp: result.timestamp,
      environment: process.env.NODE_ENV
    }

    // Send to monitoring webhook
    if (process.env.UPTIME_WEBHOOK_URL) {
      try {
        await fetch(process.env.UPTIME_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alertData)
        })
      } catch (error) {
        console.error('Failed to send uptime alert:', error)
      }
    }
  }

  private logUptimeStats(results: HealthCheckResult[]) {
    const healthyCount = results.filter(r => r.status === 'healthy').length
    const totalCount = results.length
    const healthPercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 100

    console.log(`📊 System Health: ${healthyCount}/${totalCount} services healthy (${healthPercentage.toFixed(1)}%)`)
    
    if (healthPercentage < 100) {
      console.log('🔴 Unhealthy services:', results.filter(r => r.status === 'unhealthy').map(r => r.name))
    }
  }
}

// Health check interface
export interface HealthCheck {
  timeout?: number // milliseconds
  check: () => Promise<boolean>
}

export interface HealthCheckResult {
  name: string
  status: 'healthy' | 'unhealthy'
  responseTime: number // milliseconds
  message: string
  timestamp: string
}

// Create and export singleton
export const uptimeMonitor = UptimeMonitor.getInstance()

// Initialize default health checks and start monitoring in production
if (process.env.NODE_ENV === 'production') {
  uptimeMonitor.registerDefaultHealthChecks()
  uptimeMonitor.startMonitoring(60000) // Check every minute
}
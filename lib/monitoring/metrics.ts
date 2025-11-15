import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/utils/logger'

// Performance metrics tracking
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private counters: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Track API response times
  trackApiResponseTime(endpoint: string, responseTime: number) {
    try {
      if (!this.metrics.has(endpoint)) {
        this.metrics.set(endpoint, [])
      }

      const times = this.metrics.get(endpoint)!
      times.push(responseTime)

      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift()
      }

      // Alert on slow responses
      if (responseTime > 5000) { // 5 seconds
        this.alertSlowResponse(endpoint, responseTime)
      }

      // Update Sentry metrics
      Sentry.setMeasurement('api.response_time', responseTime)
      Sentry.setTag('api.endpoint', endpoint)
    } catch (error) {
      // Silently ignore Sentry errors
      console.warn('Failed to track API response time:', error)
    }
  }

  // Get average response time for endpoint
  getAverageResponseTime(endpoint: string): number {
    const times = this.metrics.get(endpoint)
    if (!times || times.length === 0) return 0
    
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  // Track database query performance
  trackDatabaseQuery(query: string, duration: number) {
    try {
      const queryType = this.extractQueryType(query)

      // Report to Sentry
      Sentry.setMeasurement('db.query_duration', duration)
      Sentry.setTag('db.query_type', queryType)

      // Alert on slow queries
      if (duration > 1000) { // 1 second
        this.alertSlowQuery(queryType, duration)
      }
    } catch (error) {
      // Silently ignore Sentry errors
      console.warn('Failed to track database query:', error)
    }
  }

  // Track user actions
  trackUserAction(action: string, userId?: string) {
    try {
      if (typeof Sentry !== 'undefined' &&
          Sentry.metrics &&
          typeof Sentry.metrics.increment === 'function') {
        Sentry.metrics.increment('user.actions', 1, {
          tags: { action, authenticated: userId ? 'true' : 'false' }
        })
      }
    } catch (error) {
      // Silently ignore Sentry metrics errors - graceful degradation
    }
  }

  // Increment numeric counters with optional tags
  incrementCounter(metric: string, value: number = 1, tags: Record<string, string> = {}) {
    const current = this.counters.get(metric) || 0
    this.counters.set(metric, current + value)

    try {
      // Check if Sentry.metrics exists and has the increment method
      if (typeof Sentry !== 'undefined' &&
          Sentry.metrics &&
          typeof Sentry.metrics.increment === 'function') {
        Sentry.metrics.increment(metric, value, { tags })
      }
    } catch (error) {
      // Silently ignore Sentry metrics errors - graceful degradation
    }
  }

  getCounter(metric: string): number {
    return this.counters.get(metric) || 0
  }

  // Track errors
  trackError(error: Error, context: Record<string, any> = {}) {
    try {
      if (typeof Sentry !== 'undefined' && Sentry.captureException) {
        Sentry.captureException(error, {
          tags: context.tags,
          extra: context.extra,
          level: 'error'
        })

        if (Sentry.metrics && typeof Sentry.metrics.increment === 'function') {
          Sentry.metrics.increment('errors.total', 1, {
            tags: {
              type: error.constructor.name,
              ...context.tags
            }
          })
        }
      }
    } catch (sentryError) {
      // Fallback to console if Sentry fails
      console.error('Failed to track error with Sentry:', sentryError)
      console.error('Original error:', error)
    }
  }

  // Business metrics
  trackBusinessMetric(metric: string, value: number, tags: Record<string, string> = {}) {
    try {
      if (typeof Sentry !== 'undefined' &&
          Sentry.metrics &&
          typeof Sentry.metrics.gauge === 'function') {
        Sentry.metrics.gauge(`business.${metric}`, value, { tags })
      }
    } catch (error) {
      // Silently ignore Sentry metrics errors - graceful degradation
    }
  }

  private extractQueryType(query: string): string {
    const lowerQuery = query.toLowerCase().trim()
    if (lowerQuery.startsWith('select')) return 'select'
    if (lowerQuery.startsWith('insert')) return 'insert'
    if (lowerQuery.startsWith('update')) return 'update'
    if (lowerQuery.startsWith('delete')) return 'delete'
    return 'other'
  }

  private alertSlowResponse(endpoint: string, responseTime: number) {
    logger.warn(`Slow API response: ${endpoint} took ${responseTime}ms`)

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert('slow_api_response', {
        endpoint,
        responseTime,
        severity: 'warning'
      })
    }
  }

  private alertSlowQuery(queryType: string, duration: number) {
    logger.warn(`Slow database query: ${queryType} took ${duration}ms`)

    if (process.env.NODE_ENV === 'production') {
      this.sendAlert('slow_database_query', {
        queryType,
        duration,
        severity: 'warning'
      })
    }
  }

  private async sendAlert(type: string, data: any) {
    try {
      // Send to webhook or monitoring service
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            ...data
          })
        })
      }
    } catch (error) {
      logger.error('Failed to send alert', error as Error)
    }
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Helper functions
export function withPerformanceTracking<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  return fn()
    .then(result => {
      const duration = Date.now() - startTime
      performanceMonitor.trackApiResponseTime(operation, duration)
      return result
    })
    .catch(error => {
      const duration = Date.now() - startTime
      performanceMonitor.trackApiResponseTime(operation, duration)
      performanceMonitor.trackError(error, { 
        tags: { operation },
        extra: { duration }
      })
      throw error
    })
}

export function trackDatabaseOperation<T>(
  query: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  
  return operation()
    .then(result => {
      const duration = Date.now() - startTime
      performanceMonitor.trackDatabaseQuery(query, duration)
      return result
    })
    .catch(error => {
      const duration = Date.now() - startTime
      performanceMonitor.trackDatabaseQuery(query, duration)
      performanceMonitor.trackError(error, {
        tags: { type: 'database_error' },
        extra: { query, duration }
      })
      throw error
    })
}
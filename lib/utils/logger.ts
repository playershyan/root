/* eslint-disable no-console */
/**
 * ESLint console exclusion justified:
 * This is the logger implementation itself - it intentionally uses console.* methods
 * to provide structured logging with environment-aware output.
 */

// Production-safe logging utility

export interface LogContext {
  [key: string]: any
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment: boolean = process.env.NODE_ENV !== 'production'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment && this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      if (this.isDevelopment) {
        console.info(this.formatMessage('info', message, context))
      } else {
        // In production, send to Sentry
        try {
          const Sentry = require('@sentry/nextjs')
          Sentry.logger.info(message, context || {})
        } catch (e) {
          // Sentry not available, fall back to console
          console.info(this.formatMessage('info', message, context))
        }
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      if (this.isDevelopment) {
        console.warn(this.formatMessage('warn', message, context))
      } else {
        // In production, send to Sentry
        try {
          const Sentry = require('@sentry/nextjs')
          Sentry.logger.warn(message, context || {})
        } catch (e) {
          // Sentry not available, fall back to console
          console.warn(this.formatMessage('warn', message, context))
        }
      }
    }
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        } : error
      }

      if (this.isDevelopment) {
        console.error(this.formatMessage('error', message, errorContext))
        if (error instanceof Error && error.stack) {
          console.error(error.stack)
        }
      } else {
        // In production, send to Sentry
        try {
          // Dynamic import to avoid issues if Sentry is not configured
          const Sentry = require('@sentry/nextjs')
          
          // According to Sentry docs: Use logger.error for log messages, captureException for exceptions
          if (error instanceof Error) {
            // Capture exception first (creates an error event)
            Sentry.captureException(error, {
              extra: {
                message,
                ...context
              }
            })
            // Also log as structured log for correlation
            Sentry.logger.error(message, {
              ...context,
              errorName: error.name,
              errorMessage: error.message
            })
          } else {
            // Log as a structured log message with error details
            Sentry.logger.error(message, {
              ...context,
              errorDetails: error
            })
          }
        } catch (e) {
          // Sentry not available, fall back to console
          console.error(this.formatMessage('error', message, errorContext))
        }
      }
    }
  }

  // API-specific logging methods
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
  }

  apiError(method: string, path: string, error: Error, context?: LogContext): void {
    this.error(`API ${method} ${path} failed`, error, context)
  }

  apiSuccess(method: string, path: string, duration?: number, context?: LogContext): void {
    this.info(`API ${method} ${path} success${duration ? ` (${duration}ms)` : ''}`, context)
  }

  // Database operation logging
  dbQuery(query: string, context?: LogContext): void {
    this.debug(`DB Query: ${query}`, context)
  }

  dbError(operation: string, error: Error, context?: LogContext): void {
    this.error(`DB ${operation} failed`, error, context)
  }

  // Authentication logging
  authEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, { userId, ...context })
  }

  authError(event: string, error: Error, context?: LogContext): void {
    this.error(`Auth ${event} failed`, error, context)
  }

  // Security logging
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security: ${event}`, context)
  }

  securityAlert(event: string, context?: LogContext): void {
    this.error(`Security Alert: ${event}`, undefined, context)
  }

  // Convenience properties (for backward compatibility)
  api = {
    request: (method: string, path: string, context?: LogContext) =>
      this.apiRequest(method, path, context),
    error: (method: string, path: string, error: Error, context?: LogContext) =>
      this.apiError(method, path, error, context),
    success: (method: string, path: string, duration?: number, context?: LogContext) =>
      this.apiSuccess(method, path, duration, context),
  }

  db = {
    query: (query: string, context?: LogContext) => this.dbQuery(query, context),
    error: (operation: string, error: Error, context?: LogContext) =>
      this.dbError(operation, error, context),
  }

  auth = {
    event: (event: string, userId?: string, context?: LogContext) =>
      this.authEvent(event, userId, context),
    error: (event: string, error: Error, context?: LogContext) =>
      this.authError(event, error, context),
  }

  security = {
    event: (event: string, context?: LogContext) => this.securityEvent(event, context),
    alert: (event: string, context?: LogContext) => this.securityAlert(event, context),
  }
}

// Create singleton logger instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | any, context?: LogContext) => logger.error(message, error, context),
  
  // Convenience methods
  api: {
    request: (method: string, path: string, context?: LogContext) => 
      logger.apiRequest(method, path, context),
    error: (method: string, path: string, error: Error, context?: LogContext) => 
      logger.apiError(method, path, error, context),
    success: (method: string, path: string, duration?: number, context?: LogContext) => 
      logger.apiSuccess(method, path, duration, context),
  },
  
  db: {
    query: (query: string, context?: LogContext) => logger.dbQuery(query, context),
    error: (operation: string, error: Error, context?: LogContext) => 
      logger.dbError(operation, error, context),
  },
  
  auth: {
    event: (event: string, userId?: string, context?: LogContext) => 
      logger.authEvent(event, userId, context),
    error: (event: string, error: Error, context?: LogContext) => 
      logger.authError(event, error, context),
  },
  
  security: {
    event: (event: string, context?: LogContext) => logger.securityEvent(event, context),
    alert: (event: string, context?: LogContext) => logger.securityAlert(event, context),
  },
}

export default logger
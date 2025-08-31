import * as Sentry from "@sentry/nextjs"
import { AppError } from './errorHandling'

// MCP Integration
interface MCPContext {
  toolName?: string
  operation?: string
  modelRequest?: boolean
  sessionId?: string
}

// Initialize Sentry (add your DSN from Sentry dashboard)
export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions
      beforeSend(event) {
        // Filter out non-critical errors if needed
        return event
      },
    })
  }
}

// Enhanced error reporting with context (including MCP context)
export const reportError = (error: AppError | Error, context?: {
  userId?: string
  listingId?: string
  action?: string
  extra?: Record<string, any>
  mcp?: MCPContext
}) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      // Add user context
      if (context?.userId) {
        scope.setUser({ id: context.userId })
      }
      
      // Add custom context
      if (context?.listingId) {
        scope.setTag('listingId', context.listingId)
      }
      
      if (context?.action) {
        scope.setTag('action', context.action)
      }
      
      // Add MCP context
      if (context?.mcp) {
        scope.setTag('mcp.toolName', context.mcp.toolName || 'unknown')
        scope.setTag('mcp.operation', context.mcp.operation || 'unknown')
        scope.setTag('mcp.modelRequest', context.mcp.modelRequest || false)
        if (context.mcp.sessionId) {
          scope.setTag('mcp.sessionId', context.mcp.sessionId)
        }
        scope.setContext('mcp', context.mcp)
      }
      
      // Add extra context
      if (context?.extra) {
        scope.setContext('additional', context.extra)
      }
      
      // Capture the error
      if ('type' in error) {
        // AppError
        scope.setLevel('error')
        scope.setTag('errorType', error.type)
        Sentry.captureException(new Error(error.message), {
          extra: {
            details: error.details,
            code: error.code,
            retryable: error.retryable
          }
        })
      } else {
        // Regular Error
        Sentry.captureException(error)
      }
    })
  } else {
    // Development - just console log
    console.error('Error:', error, 'Context:', context)
  }
}

// Track user interactions for debugging
export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message: action,
      level: 'info',
      data: properties
    })
  }
}

// MCP-specific tracking functions
export const trackMCPOperation = (operation: string, toolName?: string, properties?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.addBreadcrumb({
      message: `MCP Operation: ${operation}`,
      level: 'info',
      category: 'mcp',
      data: {
        toolName,
        operation,
        ...properties
      }
    })
  }
}

export const reportMCPError = (error: Error, toolName: string, operation: string, sessionId?: string) => {
  reportError(error, {
    action: `mcp_${operation}`,
    mcp: {
      toolName,
      operation,
      modelRequest: true,
      sessionId
    }
  })
}

// Performance monitoring for MCP operations
export const createMCPTransaction = (name: string, operation: string) => {
  if (process.env.NODE_ENV === 'production') {
    return Sentry.startTransaction({
      name: `MCP: ${name}`,
      op: operation,
      tags: {
        'mcp.operation': operation
      }
    })
  }
  return null
}
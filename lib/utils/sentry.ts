import * as Sentry from "@sentry/nextjs"
import { AppError } from './errorHandling'

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

// Enhanced error reporting with context
export const reportError = (error: AppError | Error, context?: {
  userId?: string
  listingId?: string
  action?: string
  extra?: Record<string, any>
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
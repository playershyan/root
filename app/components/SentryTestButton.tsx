'use client'

import * as Sentry from "@sentry/nextjs"
import { useState } from 'react'

export default function SentryTestButton() {
  const [testing, setTesting] = useState(false)

  const testSentryError = () => {
    setTesting(true)
    
    // Test different types of errors
    setTimeout(() => {
      try {
        // Test JavaScript error
        throw new Error("Test error from AutoTrader.lk - Sentry integration working!")
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: 'SentryTestButton',
            action: 'manual_test'
          },
          extra: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        })
        
        // Also test our custom error handling
        import('@/lib/utils/errorHandling').then(({ logError }) => {
          logError({
            type: 'api',
            message: 'Test API error via custom error handler',
            details: 'This is a test of the custom error handling system',
            retryable: false
          }, 'sentry_test', {
            testId: Math.random().toString(36).substring(7)
          })
        })
        
        setTesting(false)
        alert('Test errors sent to Sentry! Check your Sentry dashboard.')
      }
    }, 100)
  }

  const testUserFeedback = () => {
    const user = Sentry.getCurrentScope().getUser()
    Sentry.showReportDialog({
      eventId: Sentry.captureMessage("User feedback test", "info"),
      user: user || {
        name: 'Test User',
        email: 'user@autotrader.lk'
      }
    })
  }

  // Only show in development or when specifically testing
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('sentry-test')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-red-500 text-white p-3 rounded-lg shadow-lg">
      <div className="text-sm font-bold mb-2">Sentry Test Controls</div>
      <div className="space-x-2">
        <button
          onClick={testSentryError}
          disabled={testing}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
        >
          {testing ? 'Testing...' : 'Test Error'}
        </button>
        <button
          onClick={testUserFeedback}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
        >
          Test Feedback
        </button>
      </div>
      <div className="text-xs mt-1 opacity-80">
        Add ?sentry-test to URL to show in production
      </div>
    </div>
  )
}
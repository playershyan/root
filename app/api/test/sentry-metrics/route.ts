import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    sentryAvailable: typeof Sentry !== 'undefined',
    metricsObjectExists: false,
    incrementMethodExists: false,
    countMethodExists: false,
    distributionMethodExists: false,
    gaugeMethodExists: false,
    testResults: {}
  }

  try {
    // Check Sentry.metrics object
    if (typeof Sentry !== 'undefined') {
      diagnostics.metricsObjectExists = typeof Sentry.metrics !== 'undefined'

      if (Sentry.metrics) {
        diagnostics.incrementMethodExists = typeof Sentry.metrics.increment === 'function'
        diagnostics.countMethodExists = typeof Sentry.metrics.count === 'function'
        diagnostics.distributionMethodExists = typeof Sentry.metrics.distribution === 'function'
        diagnostics.gaugeMethodExists = typeof Sentry.metrics.gauge === 'function'

        // Available methods
        diagnostics.availableMethods = Object.keys(Sentry.metrics || {})
      }
    }

    // Test 1: Try increment (recommended for Next.js SDK)
    try {
      if (Sentry.metrics && typeof Sentry.metrics.increment === 'function') {
        Sentry.metrics.increment('test.api.call', 1, {
          tags: { source: 'test-endpoint', method: 'increment' }
        })
        diagnostics.testResults.increment = 'SUCCESS'
      } else {
        diagnostics.testResults.increment = 'METHOD_NOT_AVAILABLE'
      }
    } catch (error: any) {
      diagnostics.testResults.increment = `ERROR: ${error.message}`
    }

    // Test 2: Try count (alternative API)
    try {
      if (Sentry.metrics && typeof Sentry.metrics.count === 'function') {
        Sentry.metrics.count('test.api.count', 1)
        diagnostics.testResults.count = 'SUCCESS'
      } else {
        diagnostics.testResults.count = 'METHOD_NOT_AVAILABLE'
      }
    } catch (error: any) {
      diagnostics.testResults.count = `ERROR: ${error.message}`
    }

    // Test 3: Try distribution
    try {
      if (Sentry.metrics && typeof Sentry.metrics.distribution === 'function') {
        Sentry.metrics.distribution('test.api.response_time', 150, {
          tags: { source: 'test-endpoint' }
        })
        diagnostics.testResults.distribution = 'SUCCESS'
      } else {
        diagnostics.testResults.distribution = 'METHOD_NOT_AVAILABLE'
      }
    } catch (error: any) {
      diagnostics.testResults.distribution = `ERROR: ${error.message}`
    }

    // Test 4: Try gauge
    try {
      if (Sentry.metrics && typeof Sentry.metrics.gauge === 'function') {
        Sentry.metrics.gauge('test.api.active_users', 42, {
          tags: { source: 'test-endpoint' }
        })
        diagnostics.testResults.gauge = 'SUCCESS'
      } else {
        diagnostics.testResults.gauge = 'METHOD_NOT_AVAILABLE'
      }
    } catch (error: any) {
      diagnostics.testResults.gauge = `ERROR: ${error.message}`
    }

    // Test 5: Test error tracking
    try {
      Sentry.captureException(new Error('Test error from metrics endpoint'), {
        tags: { test: true }
      })
      diagnostics.testResults.errorTracking = 'SUCCESS'
    } catch (error: any) {
      diagnostics.testResults.errorTracking = `ERROR: ${error.message}`
    }

    // Summary
    const successCount = Object.values(diagnostics.testResults).filter(v => v === 'SUCCESS').length
    const totalTests = Object.keys(diagnostics.testResults).length

    diagnostics.summary = {
      successful: successCount,
      total: totalTests,
      allPassed: successCount === totalTests,
      recommendation: getRecommendation(diagnostics)
    }

    return NextResponse.json(diagnostics, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack,
      diagnostics
    }, { status: 500 })
  }
}

function getRecommendation(diagnostics: any): string {
  if (!diagnostics.sentryAvailable) {
    return 'Sentry SDK not loaded. Check installation.'
  }

  if (!diagnostics.metricsObjectExists) {
    return 'Sentry.metrics not available. This is normal - metrics API is optional. Your app will work fine without it.'
  }

  if (diagnostics.testResults.increment === 'SUCCESS' || diagnostics.testResults.count === 'SUCCESS') {
    return 'Metrics API is working! Check your Sentry dashboard for metrics data.'
  }

  return 'Metrics API detected but not functioning. This is OK - your app will continue working. Error tracking is still active.'
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

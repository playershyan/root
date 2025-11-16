'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ 
            maxWidth: '28rem', 
            width: '100%', 
            textAlign: 'center', 
            padding: '1rem' 
          }}>
            <h1 style={{ 
              fontSize: '3.75rem', 
              fontWeight: 'bold', 
              color: '#111827', 
              marginBottom: '1rem' 
            }}>
              Error
            </h1>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '1rem' 
            }}>
              Something Went Wrong
            </h2>
            <p style={{ 
              color: '#4b5563', 
              marginBottom: '2rem' 
            }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}


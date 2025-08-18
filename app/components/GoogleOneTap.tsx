'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Script from 'next/script'

declare global {
  interface Window {
    google?: any
    handleCredentialResponse?: (response: any) => void
  }
}

export default function GoogleOneTap() {
  const { user, refreshUser } = useAuth()

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      console.log('Google credential received:', response)
      
      const res = await fetch('/api/auth/google-one-tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()
      
      if (res.ok) {
        console.log('Google auth successful:', data)
        await refreshUser()
        window.location.href = '/profile'
      } else {
        console.error('Google auth error:', data.error)
        if (data.details) {
          alert(`Google sign-in failed:\n${data.error}\n\nDetails: ${data.details}`)
        } else {
          alert(`Google sign-in failed: ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Error handling Google One Tap response:', error)
      alert('Failed to process Google sign-in. Please try again.')
    }
  }, [refreshUser])

  useEffect(() => {
    // Make callback globally available for HTML data-callback
    if (typeof window !== 'undefined') {
      window.handleCredentialResponse = handleCredentialResponse
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.handleCredentialResponse
      }
    }
  }, [handleCredentialResponse])

  const initializeGoogleOneTap = useCallback(() => {
    if (!window.google || user) return

    try {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false, // Disable auto-select to avoid conflicts
        cancel_on_tap_outside: true,
        use_federated_login_hint: false, // Disable FedCM for now
        ux_mode: 'popup', // Use popup mode instead of redirect
        context: 'signin'
      })

      // Only show prompt if user is not signed in
      if (!user) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason())
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped:', notification.getSkippedReason())
          }
        })
      }
    } catch (error) {
      console.error('Error initializing Google One Tap:', error)
    }
  }, [user, handleCredentialResponse])

  if (user) return null

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={initializeGoogleOneTap}
      />
    </>
  )
}
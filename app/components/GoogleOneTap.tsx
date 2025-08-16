'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Script from 'next/script'

declare global {
  interface Window {
    google?: any
  }
}

export default function GoogleOneTap() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
        cancel_on_tap_outside: false,
        use_federated_login_hint: true
      })

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason())
        }
      })
    }
  }, [user])

  const handleCredentialResponse = async (response: any) => {
    try {
      const res = await fetch('/api/auth/google-one-tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      })

      if (res.ok) {
        window.location.href = '/profile'
      }
    } catch (error) {
      console.error('Error handling Google One Tap response:', error)
    }
  }

  if (user) return null

  return (
    <>
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={() => {
          if (window.google && !user) {
            window.google.accounts.id.initialize({
              client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
              callback: handleCredentialResponse,
              auto_select: true,
              cancel_on_tap_outside: false,
              use_federated_login_hint: true
            })

            window.google.accounts.id.prompt()
          }
        }}
      />
      <div 
        id="g_id_onload"
        data-client_id={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
        data-callback="handleCredentialResponse"
        data-auto_select="true"
        data-cancel_on_tap_outside="false"
      />
    </>
  )
}
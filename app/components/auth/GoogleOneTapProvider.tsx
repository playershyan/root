'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import Script from 'next/script'
import type { AuthResult } from './types'
import { logger } from '@/lib/utils/logger'

declare global {
  interface Window {
    google?: any
    handleGoogleOneTapResponse?: (response: any) => void
  }
}

interface GoogleOneTapProviderProps {
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: string) => void;
  autoSelect?: boolean;
  cancelOnTapOutside?: boolean;
}

export default function GoogleOneTapProvider({
  onSuccess,
  onError,
  autoSelect = false,
  cancelOnTapOutside = true
}: GoogleOneTapProviderProps) {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [initialized, setInitialized] = useState(false)

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      logger.debug('Google One Tap credential received')

      const res = await fetch('/api/auth/google-one-tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: response.credential }),
      })

      const data = await res.json()

      if (data.success) {
        logger.info('Google One Tap sign-in successful')
        await refreshUser()
        const authResult: AuthResult = { success: true, user: data.user }
        onSuccess?.(authResult)
        router.push(authConfig.redirectUrls.afterLogin)
      } else if (data.needsOAuth) {
        // Seamlessly redirect to OAuth flow
        logger.debug('Redirecting to OAuth flow')
        const { signInWithGoogle } = await import('@/lib/auth')
        await signInWithGoogle()
      } else {
        const errorMessage = data.error || data.message || 'Google One Tap authentication failed'
        logger.error('Google One Tap error', new Error(errorMessage))
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'Failed to process Google One Tap authentication'
      logger.error('Error handling Google One Tap response', error as Error)
      onError?.(errorMessage)
    }
  }, [refreshUser, onSuccess, onError, router])

  useEffect(() => {
    // Make callback globally available for Google's script
    if (typeof window !== 'undefined') {
      window.handleGoogleOneTapResponse = handleCredentialResponse
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.handleGoogleOneTapResponse
      }
    }
  }, [handleCredentialResponse])

  const initializeGoogleOneTap = useCallback(() => {
    if (!window.google || user || initialized) return
    if (!authConfig.google.enabled || !authConfig.features.oneClickSignIn) return
    if (!authConfig.google.clientId) {
      logger.warn('Google One Tap clientId missing (NEXT_PUBLIC_GOOGLE_CLIENT_ID). Skipping initialization.', new Error('Missing client ID'))
      return
    }

    try {
      window.google.accounts.id.initialize({
        client_id: authConfig.google.clientId,
        callback: handleCredentialResponse,
        auto_select: autoSelect,
        cancel_on_tap_outside: cancelOnTapOutside,
        use_fedcm_for_prompt: true, // Chrome's third-party cookie phase-out compatibility
        ux_mode: 'popup',
        context: 'signin'
      })

      // Only show prompt if user is not signed in
      if (!user) {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            logger.debug('Google One Tap not displayed', { reason: notification.getNotDisplayedReason() })
          } else if (notification.isSkippedMoment()) {
            logger.debug('Google One Tap skipped', { reason: notification.getSkippedReason() })
          }
        })
      }

      setInitialized(true)
    } catch (error) {
      logger.error('Error initializing Google One Tap', error as Error)
      const errorMessage = 'Failed to initialize Google One Tap'
      onError?.(errorMessage)
    }
  }, [user, handleCredentialResponse, autoSelect, cancelOnTapOutside, onError, initialized])

  // Don't render if user is already signed in or Google auth is disabled
  if (user || !authConfig.google.enabled || !authConfig.features.oneClickSignIn) {
    return null
  }

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initializeGoogleOneTap}
      onError={() => {
        logger.error('Failed to load Google One Tap script', new Error('Script load failed'))
        onError?.('Failed to load Google One Tap')
      }}
    />
  )
}

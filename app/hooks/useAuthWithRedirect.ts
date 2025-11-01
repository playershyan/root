'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook to manage authentication modals with context preservation
 *
 * Handles two scenarios:
 * 1. OAuth flows (Google) - uses localStorage to persist redirect across page reload
 * 2. Modal flows (Email/Phone) - uses callback to execute action after auth
 *
 * Usage:
 * const { showAuthModal, openAuthWithRedirect, openAuthWithAction, closeAuth } = useAuthWithRedirect()
 *
 * // For page redirects (Sell, Post Wanted):
 * openAuthWithRedirect('/post')
 *
 * // For in-page actions (Make Offer, Favorites):
 * openAuthWithAction(() => setShowOfferModal(true))
 */
export function useAuthWithRedirect() {
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null)

  /**
   * Open auth modal with redirect to specific page after auth
   * Used for: Sell button, Post Wanted button
   */
  const openAuthWithRedirect = (redirectPath: string) => {
    // Store in localStorage for OAuth flows (Google)
    localStorage.setItem('pendingRedirect', redirectPath)
    setAuthCallback(() => () => {
      // This callback executes for non-OAuth flows (Email/Phone)
      router.push(redirectPath)
      localStorage.removeItem('pendingRedirect')
    })
    setShowAuthModal(true)
  }

  /**
   * Open auth modal with custom action after auth
   * Used for: Make Offer, Add to Favorites
   */
  const openAuthWithAction = (action: () => void) => {
    // Clear any pending redirects
    localStorage.removeItem('pendingRedirect')
    setAuthCallback(() => action)
    setShowAuthModal(true)
  }

  /**
   * Close auth modal and clean up
   */
  const closeAuth = () => {
    setShowAuthModal(false)
    setAuthCallback(null)
    localStorage.removeItem('pendingRedirect')
  }

  /**
   * Handler to pass to AuthModal's onAuthSuccess
   */
  const handleAuthSuccess = () => {
    if (authCallback) {
      authCallback()
    }
    setAuthCallback(null)
  }

  return {
    showAuthModal,
    openAuthWithRedirect,
    openAuthWithAction,
    closeAuth,
    handleAuthSuccess
  }
}

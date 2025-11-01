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
    console.log('🚀 openAuthWithRedirect - Setting localStorage:', redirectPath)
    localStorage.setItem('pendingRedirect', redirectPath)
    console.log('✅ openAuthWithRedirect - Verify localStorage:', localStorage.getItem('pendingRedirect'))

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
   * @param action - Callback to execute after successful auth (for email/phone flows)
   * @param actionType - Type of action: 'make-offer' or 'add-favorite'
   * @param actionData - Additional data needed to re-execute action after OAuth (e.g., listingId)
   */
  const openAuthWithAction = (action: () => void, actionType?: string, actionData?: any) => {
    // For OAuth flows (Google), store current page as redirect target
    // This ensures user returns to current page, then callback executes
    const currentPath = window.location.pathname
    console.log('🎬 openAuthWithAction - Storing current path for OAuth:', currentPath)
    localStorage.setItem('pendingRedirect', currentPath)
    localStorage.setItem('pendingAction', actionType || 'true') // Store action type
    if (actionData) {
      localStorage.setItem('pendingActionData', JSON.stringify(actionData))
    }

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
    localStorage.removeItem('pendingAction')
    localStorage.removeItem('pendingActionData')
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

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from './auth'
import { logger } from '@/lib/utils/logger'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string>('')

  useEffect(() => {
    const authParam = searchParams.get('auth')
    const redirectParam = searchParams.get('redirect')

    logger.debug('AuthWrapper parameters', {
      component: 'AuthWrapper',
      authParam,
      redirectParam
    })

    if (authParam === 'true') {
      const redirectUrl = redirectParam || ''
      logger.debug('Setting return URL for auth modal', {
        component: 'AuthWrapper',
        returnUrl: redirectUrl
      })

      // Store in sessionStorage as backup
      if (redirectUrl) {
        sessionStorage.setItem('pendingRedirect', redirectUrl)
        logger.debug('Stored redirect in sessionStorage', {
          component: 'AuthWrapper',
          redirectUrl
        })
      }
      
      setShowAuthModal(true)
      setReturnUrl(redirectUrl)
      
      // Clean up the URL after a small delay to ensure state is set
      setTimeout(() => {
        const url = new URL(window.location.href)
        url.searchParams.delete('auth')
        url.searchParams.delete('redirect')
        router.replace(url.pathname, { scroll: false })
      }, 100)
    }
  }, [searchParams, router])

  const handleCloseAuthModal = () => {
    setShowAuthModal(false)
    setReturnUrl('')
  }

  logger.debug('AuthWrapper current state', {
    component: 'AuthWrapper',
    returnUrl,
    showAuthModal
  })

  return (
    <>
      {children}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleCloseAuthModal}
        />
      )}
    </>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthModal } from './auth'

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string>('')

  useEffect(() => {
    const authParam = searchParams.get('auth')
    const redirectParam = searchParams.get('redirect')
    
    console.log('AuthWrapper - Auth param:', authParam)
    console.log('AuthWrapper - Redirect param:', redirectParam)
    
    if (authParam === 'true') {
      const redirectUrl = redirectParam || ''
      console.log('AuthWrapper - Setting returnUrl to:', redirectUrl)
      
      // Store in sessionStorage as backup
      if (redirectUrl) {
        sessionStorage.setItem('pendingRedirect', redirectUrl)
        console.log('AuthWrapper - Stored in sessionStorage:', redirectUrl)
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

  console.log('AuthWrapper - Current returnUrl state:', returnUrl)
  
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
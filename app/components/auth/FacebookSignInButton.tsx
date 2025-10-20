'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import type { AuthButtonProps, AuthResult } from './types'

interface FacebookSignInButtonProps extends AuthButtonProps {
  showIcon?: boolean;
  text?: string;
}

export default function FacebookSignInButton({
  loading: externalLoading = false,
  disabled = false,
  className = '',
  onSuccess,
  onError,
  variant = 'default',
  size = 'medium',
  showIcon = true,
  text = 'Continue with Facebook'
}: FacebookSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const { refreshUser } = useAuth()
  const router = useRouter()

  if (!authConfig.facebook.enabled) {
    return null
  }

  const handleSignIn = async () => {
    if (loading || externalLoading || disabled) return

    setLoading(true)
    
    try {
      // Import the Facebook auth function when needed
      const { signInWithFacebook } = await import('@/lib/auth')
      const result = await signInWithFacebook()
      
      if (result.success) {
        await refreshUser()
        const authResult: AuthResult = { success: true }
        onSuccess?.(authResult)
        router.push(authConfig.redirectUrls.afterLogin)
      } else {
        const errorMessage = result.error?.message || 'Failed to sign in with Facebook'
        onError?.(errorMessage)
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred with Facebook sign-in'
      console.error('Facebook sign-in error:', error)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const baseClasses = 'flex items-center justify-center gap-3 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    default: 'bg-[#1877F2] border border-[#1877F2] text-white hover:bg-[#166FE5] focus:ring-[#1877F2]',
    outlined: 'bg-transparent border-2 border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white focus:ring-[#1877F2]',
    text: 'bg-transparent border-none text-[#1877F2] hover:bg-blue-50 focus:ring-[#1877F2]'
  }

  const sizeClasses = {
    small: 'px-3 py-2 text-sm rounded-md',
    medium: 'px-4 py-3 text-base rounded-lg',
    large: 'px-6 py-4 text-lg rounded-lg'
  }

  const finalClassName = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${loading || externalLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  return (
    <button
      onClick={handleSignIn}
      disabled={loading || externalLoading || disabled}
      className={finalClassName}
      type="button"
      aria-label="Sign in with Facebook"
    >
      {loading || externalLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          {showIcon && (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          )}
          <span>{text}</span>
        </>
      )}
    </button>
  )
}
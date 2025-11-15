'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { signUp, signInWithPassword } from '@/lib/auth'
import { validateEmail } from '@/lib/errorHandling'
import type { EmailAuthProps, AuthResult } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface EmailAuthFormProps extends EmailAuthProps {
  showToggle?: boolean;
  onForgotPassword?: () => void;
}

export default function EmailAuthForm({
  type: initialType = 'login',
  loading: externalLoading = false,
  disabled = false,
  className = '',
  onSuccess,
  onError,
  showToggle = true,
  onForgotPassword
}: EmailAuthFormProps) {
  const [type, setType] = useState<'login' | 'register'>(initialType)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { refreshUser } = useAuth()
  const router = useRouter()

  if (!authConfig.email.enabled) {
    return (
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
        <p className="text-sm text-gray-600">Email authentication is temporarily disabled</p>
      </div>
    )
  }

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      return data.exists
    } catch (error) {
      logger.error('Email check failed', error as Error, {
        component: 'EmailAuthForm',
        action: 'checkEmailExists'
      })
      return false // Fail open - allow registration attempt
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (type === 'register') {
      if (!name.trim()) {
        newErrors.name = 'Name is required'
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || externalLoading || disabled) return
    if (!validateForm()) return

    setLoading(true)

    try {
      let result

      if (type === 'register') {
        // Check if email already exists before attempting signup
        const emailExists = await checkEmailExists(email)

        if (emailExists) {
          setErrors({
            email: 'This email is already registered. Please log in instead.'
          })
          setLoading(false)
          return
        }

        result = await signUp(email, password, name)
        
        // Check if email verification is required
        if (result.success && result.requiresEmailVerification) {
          const authResult: AuthResult = {
            success: true,
            requiresEmailVerification: true,
            user: result.user,
            email: email
          }
          onSuccess?.(authResult)
          setLoading(false)
          return
        }
      } else {
        result = await signInWithPassword(email, password)
      }
      
      if (result.success) {
        // Email verification already handled above for registration
        if (type === 'register' && result.requiresEmailVerification) {
          // Already handled above, should not reach here
        } else {
          await refreshUser()
          const authResult: AuthResult = { success: true, user: result.user }
          onSuccess?.(authResult)
          // Only redirect if no onSuccess callback provided
          if (!onSuccess) {
            router.push(authConfig.redirectUrls.afterLogin)
          }
        }
      } else {
        const errorMessage = result.error?.message || `Failed to ${type === 'register' ? 'create account' : 'sign in'}`
        onError?.(errorMessage)
        setErrors({ general: errorMessage })
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      logger.error(`Email ${type} error`, error as Error, {
        component: 'EmailAuthForm',
        action: 'handleSubmit',
        authType: type
      })
      onError?.(errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {type === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="name">
              Full Name
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              placeholder="Enter your full name"
              disabled={loading || externalLoading || disabled}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            placeholder="Enter your email"
            disabled={loading || externalLoading || disabled}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">
              Password
            </Label>
            {type === 'login' && onForgotPassword && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onForgotPassword}
                className="h-auto p-0 text-sm"
                disabled={loading || externalLoading || disabled}
              >
                Forgot password?
              </Button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
            placeholder="Enter your password"
            disabled={loading || externalLoading || disabled}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {type === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
              placeholder="Confirm your password"
              disabled={loading || externalLoading || disabled}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="default"
          className="w-full"
          disabled={loading || externalLoading || disabled}
        >
          {loading || externalLoading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {type === 'register' ? 'Creating Account...' : 'Signing In...'}
            </>
          ) : (
            type === 'register' ? 'Create Account' : 'Sign In'
          )}
        </Button>
      </form>

      {showToggle && (
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setType(type === 'register' ? 'login' : 'register')}
            className="h-auto p-0"
            disabled={loading || externalLoading || disabled}
          >
            {type === 'register'
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"
            }
          </Button>
        </div>
      )}
    </div>
  )
}
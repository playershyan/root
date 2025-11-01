'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { authConfig } from '@/lib/config/auth.config'
import { signUp, signInWithPassword } from '@/lib/auth'
import { validateEmail } from '@/lib/errorHandling'
import type { EmailAuthProps, AuthResult } from './types'

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
      console.error('Email check failed:', error)
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
      } else {
        result = await signInWithPassword(email, password)
      }
      
      if (result.success) {
        if (result.requiresEmailVerification) {
          const authResult: AuthResult = {
            success: true,
            requiresEmailVerification: true,
            user: result.user
          }
          onSuccess?.(authResult)
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
      console.error(`Email ${type} error:`, error)
      onError?.(errorMessage)
      setErrors({ general: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const inputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  const errorInputClasses = "border-red-500 focus:ring-red-500"

  return (
    <div className={`space-y-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {type === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClasses} ${errors.name ? errorInputClasses : ''}`}
              placeholder="Enter your full name"
              disabled={loading || externalLoading || disabled}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClasses} ${errors.email ? errorInputClasses : ''}`}
            placeholder="Enter your email"
            disabled={loading || externalLoading || disabled}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            {type === 'login' && onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                disabled={loading || externalLoading || disabled}
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClasses} ${errors.password ? errorInputClasses : ''}`}
            placeholder="Enter your password"
            disabled={loading || externalLoading || disabled}
          />
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        {type === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${inputClasses} ${errors.confirmPassword ? errorInputClasses : ''}`}
              placeholder="Confirm your password"
              disabled={loading || externalLoading || disabled}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || externalLoading || disabled}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading || externalLoading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {type === 'register' ? 'Creating Account...' : 'Signing In...'}
            </>
          ) : (
            type === 'register' ? 'Create Account' : 'Sign In'
          )}
        </button>
      </form>

      {showToggle && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setType(type === 'register' ? 'login' : 'register')}
            className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
            disabled={loading || externalLoading || disabled}
          >
            {type === 'register' 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Create one"
            }
          </button>
        </div>
      )}
    </div>
  )
}
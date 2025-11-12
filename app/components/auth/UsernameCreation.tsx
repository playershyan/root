'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { logger } from '@/lib/utils/logger'

interface UsernameCreationProps {
  phoneNumber: string
  userId: string
  onAccountCreated: () => void
  onBack: () => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function UsernameCreation({
  phoneNumber,
  userId,
  onAccountCreated,
  onBack,
  loading,
  setLoading
}: UsernameCreationProps) {
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [error, setError] = useState('')

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    const cleaned = phone.replace(/^\+?94/, '').replace(/^0/, '')
    if (cleaned.length >= 7) {
      return `+94 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
    }
    return phone
  }

  // Username validation rules
  const validateUsername = (value: string): { isValid: boolean; message?: string } => {
    if (value.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' }
    }
    if (value.length > 20) {
      return { isValid: false, message: 'Username must be 20 characters or less' }
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      return { isValid: false, message: 'Username can only contain letters, numbers, dots, dashes, and underscores' }
    }
    if (/^[._-]/.test(value) || /[._-]$/.test(value)) {
      return { isValid: false, message: 'Username cannot start or end with special characters' }
    }
    if (/[._-]{2,}/.test(value)) {
      return { isValid: false, message: 'Username cannot contain consecutive special characters' }
    }
    return { isValid: true }
  }

  // Debounced username availability check (native implementation)
  const debouncedCheckAvailability = useMemo(
    () => {
      let timeout: NodeJS.Timeout
      return (value: string) => {
        clearTimeout(timeout)
        timeout = setTimeout(async () => {
          if (!value.trim()) {
            setUsernameStatus('idle')
            return
          }

          const validation = validateUsername(value)
          if (!validation.isValid) {
            setUsernameStatus('invalid')
            setError(validation.message || 'Invalid username')
            return
          }

          setUsernameStatus('checking')
          setError('')

          try {
            const response = await fetch('/api/auth/check-username', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username: value }),
            })

            const result = await response.json()

            if (result.available) {
              setUsernameStatus('available')
            } else {
              setUsernameStatus('taken')
              setError('Username is already taken')
            }
          } catch (error) {
            logger.error('Username check error', error as Error, {
              component: 'UsernameCreation',
              action: 'debouncedCheckAvailability'
            })
            setUsernameStatus('invalid')
            setError('Failed to check username availability')
          }
        }, 500)
      }
    },
    []
  )

  // Check username availability when it changes
  useEffect(() => {
    if (username) {
      debouncedCheckAvailability(username)
    }
    return () => {
      debouncedCheckAvailability.cancel()
    }
  }, [username, debouncedCheckAvailability])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().trim()
    setUsername(value)

    if (!value) {
      setUsernameStatus('idle')
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading || usernameStatus !== 'available') return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          username,
          phoneNumber,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Account created successfully
        onAccountCreated()
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (error) {
      logger.error('Account creation error', error as Error, {
        component: 'UsernameCreation',
        action: 'handleSubmit'
      })
      setError('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      case 'available':
        return <Check className="w-4 h-4 text-green-500" />
      case 'taken':
      case 'invalid':
        return <X className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusMessage = () => {
    switch (usernameStatus) {
      case 'checking':
        return 'Checking availability...'
      case 'available':
        return 'Username is available!'
      case 'taken':
        return 'Username is already taken'
      case 'invalid':
        return error
      default:
        return ''
    }
  }

  const isSubmitDisabled = usernameStatus !== 'available' || loading || !username.trim()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your Account
        </h2>
        <div className="text-gray-600">
          <p>Phone verified:</p>
          <p className="text-gray-900 font-medium">
            {formatPhoneForDisplay(phoneNumber)}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && usernameStatus !== 'invalid' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <Label htmlFor="username">
            Choose a Username
          </Label>
          <div className="relative">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={`pr-10 ${
                usernameStatus === 'available' ? 'border-green-300' :
                usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-300' :
                ''
              }`}
              placeholder="your_username"
              disabled={loading}
              autoComplete="username"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {getStatusIcon()}
            </div>
          </div>

          {/* Status Message */}
          {usernameStatus !== 'idle' && (
            <p className={`mt-1 text-sm ${
              usernameStatus === 'available' ? 'text-green-600' :
              usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {getStatusMessage()}
            </p>
          )}

          {/* Username Guidelines */}
          <div className="mt-2">
            <p className="text-xs text-gray-500">Username requirements:</p>
            <ul className="text-xs text-gray-500 list-disc list-inside mt-1">
              <li>3-20 characters long</li>
              <li>Only letters, numbers, dots, dashes, and underscores</li>
              <li>Cannot start or end with special characters</li>
            </ul>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitDisabled}
          variant="default"
          size="default"
          className="w-full"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          You can change your username later in your profile settings
        </p>
      </div>
    </div>
  )
}
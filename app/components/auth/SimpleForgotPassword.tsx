'use client'

import React, { useState } from 'react'
import { validateEmail } from '@/lib/errorHandling'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SimpleForgotPasswordProps {
  onBack?: () => void;
  initialEmail?: string;
}

export default function SimpleForgotPassword({
  onBack,
  initialEmail = ''
}: SimpleForgotPasswordProps) {
  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return

    setError('')

    if (!email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/update-password`,
      })

      if (error) {
        // Check if it's a rate limit error
        if (error.message.includes('rate') || error.message.includes('limit')) {
          setError('Too many reset attempts. Please try again later.')
        } else if (error.message.includes('not found')) {
          // Don't reveal if email exists or not for security
          setSuccess(true)
        } else {
          setError(error.message || 'Failed to send reset email')
        }
      } else {
        setSuccess(true)
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Check Your Email</h3>
          <p className="text-sm text-gray-600 mb-1">
            We've sent a password reset link to
          </p>
          <p className="text-sm font-medium text-gray-700 mb-4">{email}</p>
          <p className="text-xs text-gray-500 mb-6">
            Click the link in your email to reset your password.
            <br />
            The link will expire in 1 hour.
          </p>
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="ghost"
        size="sm"
        className="mb-4 gap-2"
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Button>

      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Reset your password</h3>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="reset-email">
            Email Address
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            inputMode="email"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="default"
          size="default"
          className="w-full"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      </form>
    </div>
  )
}
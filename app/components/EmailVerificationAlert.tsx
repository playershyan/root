'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X, AlertTriangle } from 'lucide-react'

export default function EmailVerificationAlert() {
  const searchParams = useSearchParams()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (searchParams.get('email_verified') === 'true') {
      setShowSuccess(true)
      // Remove the query param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('email_verified')
      window.history.replaceState({}, '', url)
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccess(false), 10000)
    }
    
    if (searchParams.get('email_verification_failed') === 'true') {
      setShowError(true)
      // Remove the query param from URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('email_verification_failed')
      window.history.replaceState({}, '', url)
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShowError(false), 10000)
    }
  }, [searchParams])

  if (showSuccess) {
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
        <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800 font-medium">Email Verified Successfully!</p>
            <p className="text-green-700 text-sm">Your email address has been verified.</p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  if (showError) {
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
        <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px]">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium">Verification Failed</p>
            <p className="text-red-700 text-sm">The verification link is invalid or expired.</p>
          </div>
          <button
            onClick={() => setShowError(false)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
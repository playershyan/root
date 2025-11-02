'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import { useToast } from '@/app/components/notifications/useToast'
import { Toast } from '@/app/components/notifications/Toast'
import Link from 'next/link'

interface WantedRequest {
  id: string
  title: string
  user_id: string
  min_budget: number | null
  max_budget: number | null
  location: string
  created_at: string
}

export default function WantedPaymentPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.requestId as string
  const { user, loading: authLoading } = useAuth()
  const { toasts, showError, showSuccess, removeToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [request, setRequest] = useState<WantedRequest | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | ''>('')

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?auth=true&redirect=/wanted')
    }
  }, [user, authLoading, router])

  // Load wanted request details
  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId || !user) return

      try {
        const { data, error } = await supabase
          .from('wanted_requests')
          .select('id, title, user_id, min_budget, max_budget, location, created_at')
          .eq('id', requestId)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setRequest(data)
      } catch (error) {
        console.error('Error loading wanted request:', error)
        showError('Error loading request details. Redirecting...', 3000)
        setTimeout(() => router.push('/wanted'), 2000)
      } finally {
        setPageLoading(false)
      }
    }

    loadRequest()
  }, [requestId, user, router])

  const handlePayment = async () => {
    if (!paymentMethod) {
      showError('Please select a payment method', 3000)
      return
    }

    setLoading(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Call API endpoint to mark as paid and activate high priority
      const response = await fetch('/api/wanted-requests/payment/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          paymentMethod,
          amount: 1500
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed')
      }

      showSuccess('Payment successful! Your request is now marked as High Priority.', 3000)
      setTimeout(() => router.push('/wanted?payment=success'), 2000)
    } catch (error) {
      console.error('Payment error:', error)
      showError('Payment failed. Please try again.', 4000)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)

    try {
      // Call API to activate request as regular (non-high-priority)
      const response = await fetch('/api/wanted-requests/payment/skip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish request')
      }

      showSuccess('Request published without High Priority. Pending admin approval.', 3000)
      setTimeout(() => router.push('/wanted?posted=success'), 1500)
    } catch (error) {
      console.error('Skip payment error:', error)
      showError('Failed to publish request. Please try again.', 4000)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Request not found</p>
          <Link href="/wanted" className="text-blue-600 hover:underline mt-2 block">
            Return to Wanted Requests
          </Link>
        </div>
      </div>
    )
  }

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget not specified'
    if (!min) return `Up to Rs. ${(max! / 1000000).toFixed(1)}M`
    if (!max) return `Rs. ${(min / 1000000).toFixed(1)}M+`
    return `Rs. ${(min / 1000000).toFixed(1)}M - ${(max / 1000000).toFixed(1)}M`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">High Priority Payment</h1>
              <p className="text-sm text-gray-600">Complete payment to activate your high priority request</p>
            </div>
          </div>

          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h2 className="font-semibold text-gray-900">{request.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{formatBudget(request.min_budget, request.max_budget)}</span>
              <span>•</span>
              <span>{request.location}</span>
            </div>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">High Priority Feature</span>
              <span className="font-medium text-gray-900">Rs. 1,500.00</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium text-gray-900">7 Days</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-orange-600">Rs. 1,500.00</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 bg-orange-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Benefits of High Priority:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Appears at the top of search results</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Distinctive orange badge for high visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Get more seller responses faster</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method (Mockup)</h2>
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'card' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                className="w-5 h-5 text-orange-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Credit / Debit Card</div>
                <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </label>

            <label className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'bank' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank')}
                className="w-5 h-5 text-orange-600"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Bank Transfer</div>
                <div className="text-sm text-gray-600">Direct bank transfer</div>
              </div>
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </label>
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a mockup payment interface. No actual payment will be processed.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handlePayment}
            disabled={!paymentMethod || loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                Processing Payment...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complete Payment - Rs. 1,500
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={loading}
            className="w-full bg-white text-gray-700 py-3 rounded-lg font-medium border-2 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip and Publish as Regular Request
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </div>
  )
}

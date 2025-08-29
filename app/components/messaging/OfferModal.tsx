'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'

interface OfferModalProps {
  isOpen: boolean
  onClose: () => void
  onSendOffer: (amount: number, message?: string) => Promise<void>
  listingTitle: string
  listingPrice: number
  loading?: boolean
}

export default function OfferModal({
  isOpen,
  onClose,
  onSendOffer,
  listingTitle,
  listingPrice,
  loading = false
}: OfferModalProps) {
  const { user } = useAuth()
  const [offerAmount, setOfferAmount] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const validateOffer = (): boolean => {
    const newErrors: Record<string, string> = {}
    const amount = parseFloat(offerAmount)

    if (!offerAmount) {
      newErrors.amount = 'Offer amount is required'
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    } else if (amount > listingPrice * 2) {
      newErrors.amount = 'Offer amount seems too high'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateOffer() || submitting || loading) return

    setSubmitting(true)
    try {
      await onSendOffer(parseFloat(offerAmount), message)
      // Reset form on success
      setOfferAmount('')
      setMessage('')
      onClose()
    } catch (error) {
      console.error('Error sending offer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Make an Offer</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={submitting || loading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Listing Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{listingTitle}</h3>
            <p className="text-sm text-gray-600">
              Listed at: <span className="font-semibold text-blue-600">{formatCurrency(listingPrice)}</span>
            </p>
          </div>

          {/* Offer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Offer Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Offer Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Rs.</span>
                </div>
                <input
                  type="number"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your offer amount"
                  disabled={submitting || loading}
                  min="1"
                  step="1"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Optional Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a message to explain your offer..."
                disabled={submitting || loading}
                maxLength={500}
              />
              <p className="mt-1 text-sm text-gray-500">
                {message.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={submitting || loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {submitting || loading ? (
                  <>
                    <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Offer'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
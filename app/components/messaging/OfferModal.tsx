'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { Label } from '@/app/components/ui/label'

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
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              disabled={submitting || loading}
            >
              <X size={20} />
            </Button>
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
              <Label htmlFor="offer-amount">
                Your Offer Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <span className="text-gray-500 text-sm">Rs.</span>
                </div>
                <Input
                  id="offer-amount"
                  type="number"
                  inputMode="numeric"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className={`pl-12 ${errors.amount ? 'border-red-300' : ''}`}
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
              <Label htmlFor="offer-message">
                Message (Optional)
              </Label>
              <Textarea
                id="offer-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-2"
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
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={submitting || loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || loading}
                variant="primary"
                className="flex-1"
              >
                {submitting || loading ? (
                  <>
                    <div className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Offer'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
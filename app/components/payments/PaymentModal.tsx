'use client'

import { useState } from 'react'
import { X, CreditCard, Smartphone } from 'lucide-react'
import { useStripePayment } from '@/lib/payments/stripeService'
import { PayHerePaymentForm } from '@/lib/payments/payhereService'
import { PromotionType } from '@/lib/services/promotionService'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  selectedFeatures: PromotionType[]
  totalAmount: number
  onSuccess?: () => void
}

export default function PaymentModal({
  isOpen,
  onClose,
  listingId,
  selectedFeatures,
  totalAmount,
  onSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'payhere'>('payhere')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { initiatePayment } = useStripePayment()

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^0\d{9}$/.test(customerInfo.phone)) {
      newErrors.phone = 'Invalid Sri Lankan phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleStripePayment = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await initiatePayment({
        listingId,
        promotionTypes: selectedFeatures,
        customerEmail: customerInfo.email,
        customerName: customerInfo.name
      })

      // Redirect to Stripe Checkout or handle client secret
      if (result.clientSecret) {
        // Implement Stripe Elements or redirect to checkout
        console.log('Stripe payment initiated:', result.clientSecret)
      }
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayHereSubmit = () => {
    if (!validateForm()) return
    // PayHere form will handle the submission
    setLoading(true)
  }

  const featureLabels: Record<PromotionType, string> = {
    featured: 'Featured',
    top_spot: 'Top Spot',
    boost: 'Boost',
    urgent: 'Urgent'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              {selectedFeatures.map((feature) => (
                <div key={feature} className="flex justify-between text-sm">
                  <span>{featureLabels[feature]}</span>
                  <span>Rs. {feature === 'featured' ? '3,500' : feature === 'top_spot' ? '1,200' : feature === 'boost' ? '800' : '600'}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rs. {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold">Contact Information</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0771234567"
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="payhere"
                  checked={paymentMethod === 'payhere'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'payhere')}
                  className="mr-3"
                />
                <Smartphone className="w-5 h-5 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">PayHere (Recommended)</div>
                  <div className="text-sm text-gray-500">Local payment gateway - Cards, Mobile, Banking</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'stripe')}
                  className="mr-3"
                />
                <CreditCard className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Credit/Debit Card</div>
                  <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            {paymentMethod === 'payhere' && (
              <PayHerePaymentForm
                paymentData={{
                  listingId,
                  promotionTypes: selectedFeatures,
                  customerEmail: customerInfo.email,
                  customerName: customerInfo.name,
                  customerPhone: customerInfo.phone
                }}
                onSubmit={handlePayHereSubmit}
                className="w-full"
              />
            )}

            {paymentMethod === 'stripe' && (
              <button
                onClick={handleStripePayment}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Processing...' : `Pay Rs. ${totalAmount.toLocaleString()}`}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full border border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>🔒 Your payment information is secure and encrypted</p>
          </div>
        </div>
      </div>
    </div>
  )
}
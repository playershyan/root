'use client'

import { useState, useEffect } from 'react'
import { X, CreditCard, Smartphone, TestTube, AlertCircle } from 'lucide-react'
import { PayHerePaymentForm } from '@/lib/payments/payhereService'
import { PromotionType } from '@/lib/services/promotionService'
import { validatePhone } from '@/lib/errorHandling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  listingId: string
  selectedFeatures: PromotionType[]
  totalAmount: number
  onSuccess?: () => void
  entityType?: 'listing' | 'wanted' // Support both listings and wanted requests
  entityId?: string // For wanted requests, use requestId instead of listingId
}

export default function PaymentModal({
  isOpen,
  onClose,
  listingId,
  selectedFeatures,
  totalAmount,
  onSuccess,
  entityType = 'listing',
  entityId
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'sandbox'>('payhere')
  const [sandboxEnabled, setSandboxEnabled] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check if sandbox is enabled
  useEffect(() => {
    // Check if sandbox mode is available (client-side check)
    const checkSandbox = async () => {
      try {
        const response = await fetch('/api/payments/sandbox/check', { method: 'GET' })
        if (response.ok) {
          const data = await response.json()
          setSandboxEnabled(data.enabled || false)
        }
      } catch (error) {
        // Sandbox check failed, assume disabled
        setSandboxEnabled(false)
      }
    }
    
    if (isOpen) {
      checkSandbox()
    }
  }, [isOpen])

  // Use entityId if provided, otherwise fall back to listingId
  const targetId = entityId || listingId


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
    } else {
      const cleanedPhone = customerInfo.phone.replace(/[^0-9]/g, '')
      if (!validatePhone(cleanedPhone)) {
        newErrors.phone = 'Invalid Sri Lankan phone number (e.g., 0771234567 or 771234567)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handlePayHereSubmit = () => {
    if (!validateForm()) return
    // PayHere form will handle the submission
    setLoading(true)
  }

  const handleSandboxPayment = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: targetId,
          promotionTypes: selectedFeatures,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          scenario: 'success', // Always use success for production sandbox
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Payment processed successfully (Sandbox)')
        if (onSuccess) {
          onSuccess()
        }
        onClose()
      } else {
        toast.error(result.message || 'Payment failed (Sandbox)')
      }
    } catch (error) {
      toast.error('Error processing sandbox payment')
      console.error('Sandbox payment error:', error)
    } finally {
      setLoading(false)
    }
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
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <X className="w-5 h-5" />
          </Button>
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
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className={errors.name ? 'border-red-300' : ''}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                className={errors.email ? 'border-red-300' : ''}
                placeholder="your@email.com"
                inputMode="email"
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className={errors.phone ? 'border-red-300' : ''}
                placeholder="0771234567"
                inputMode="tel"
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 min-h-touch active:scale-95 transition-transform">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="payhere"
                  checked={paymentMethod === 'payhere'}
                  onChange={() => setPaymentMethod('payhere')}
                  className="mr-3 w-5 h-5"
                />
                <Smartphone className="w-5 h-5 mr-3 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">PayHere (Recommended)</div>
                  <div className="text-sm text-gray-500">Local payment gateway - Cards, Mobile, Banking</div>
                </div>
              </label>

              {sandboxEnabled && (
                <label className="flex items-center p-4 border-2 border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-50 min-h-touch active:scale-95 transition-transform bg-yellow-50/50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="sandbox"
                    checked={paymentMethod === 'sandbox'}
                    onChange={() => setPaymentMethod('sandbox')}
                    className="mr-3 w-5 h-5"
                  />
                  <TestTube className="w-5 h-5 mr-3 text-yellow-600" />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      Sandbox Mode (Testing)
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">TEST</span>
                    </div>
                    <div className="text-sm text-gray-600">Test payment without real charges</div>
                  </div>
                </label>
              )}
            </div>

            {sandboxEnabled && paymentMethod === 'sandbox' && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Sandbox Mode:</strong> This will create real promotions in the database but won't charge any money. Use this for testing purposes only.
                </div>
              </div>
            )}
          </div>

          {/* Payment Buttons */}
          <div className="space-y-3">
            {paymentMethod === 'payhere' && (
              <PayHerePaymentForm
                paymentData={{
                  listingId: targetId,
                  promotionTypes: selectedFeatures,
                  customerEmail: customerInfo.email,
                  customerName: customerInfo.name,
                  customerPhone: customerInfo.phone
                }}
                onSubmit={handlePayHereSubmit}
                className="w-full"
              />
            )}

            {paymentMethod === 'sandbox' && (
              <Button
                onClick={handleSandboxPayment}
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Processing Sandbox Payment...
                  </>
                ) : (
                  <>
                    <TestTube className="w-5 h-5 mr-2 inline" />
                    Test Payment (Sandbox)
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              size="default"
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
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

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'
import { SandboxPaymentService } from '@/lib/payments/sandboxPaymentService'
import { PromotionType, PROMOTION_PRICING } from '@/lib/services/promotionService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, AlertCircle, CreditCard, Play, Info } from 'lucide-react'

export default function PaymentSandbox() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [listingId, setListingId] = useState(searchParams.get('listing') || '')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Test User',
    email: 'test@example.com',
    phone: '0771234567'
  })
  const [selectedScenario, setSelectedScenario] = useState<'success' | 'failure' | 'delayed' | 'partial'>('success')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [sandboxEnabled, setSandboxEnabled] = useState(true)

  useEffect(() => {
    // Check if sandbox is enabled
    // In a real app, you'd check this from the environment or API
    setSandboxEnabled(true)
  }, [])

  const promotionTypes: Array<{ id: PromotionType; name: string; price: number; description: string }> = [
    { id: 'featured', name: 'Featured', price: PROMOTION_PRICING.featured.price, description: 'Top 2 spots, homepage visibility' },
    { id: 'top_spot', name: 'Top Spot', price: PROMOTION_PRICING.top_spot.price, description: 'Category top slots' },
    { id: 'boost', name: 'Boost', price: PROMOTION_PRICING.boost.price, description: 'Daily repositioning' },
    { id: 'urgent', name: 'Urgent', price: PROMOTION_PRICING.urgent.price, description: 'Urgent badge, priority placement' }
  ]

  const testScenarios = SandboxPaymentService.getTestScenarios()

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const calculateTotal = () => {
    return selectedFeatures.reduce((total, featureId) => {
      const feature = promotionTypes.find(f => f.id === featureId)
      return total + (feature ? feature.price : 0)
    }, 0)
  }

  const handleTestPayment = async () => {
    if (!listingId.trim()) {
      toast.error('Please enter a listing ID')
      return
    }

    if (selectedFeatures.length === 0) {
      toast.error('Please select at least one promotion feature')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/payments/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          promotionTypes: selectedFeatures,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          scenario: selectedScenario,
          delay: selectedScenario === 'delayed' ? 3000 : undefined
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ ...data, success: true })
        toast.success('Payment processed successfully (Sandbox)')
        
        // Redirect after successful payment
        setTimeout(() => {
          router.push(`/profile?tab=listings&payment=sandbox-success&orderId=${data.orderId}`)
        }, 2000)
      } else {
        setResult({ ...data, success: false })
        toast.error(data.message || 'Payment failed (Sandbox)')
      }
    } catch (error) {
      logger.error('Sandbox payment test error', error as Error)
      toast.error('Error processing payment test')
      setResult({
        success: false,
        message: `Error: ${(error as Error).message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const resetTest = () => {
    setResult(null)
    setSelectedFeatures([])
  }

  if (!sandboxEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Sandbox Not Enabled</h2>
          <p className="text-gray-600 text-center mb-6">
            Payment sandbox mode is not enabled. Set <code className="bg-gray-100 px-2 py-1 rounded">PAYMENT_SANDBOX_MODE=true</code> in your environment variables.
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            Go to Homepage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <Info className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🧪 Payment Sandbox - Test Paid Features
              </h1>
              <p className="text-gray-700">
                Use this sandbox to test payment flows and promotion features without processing real payments.
                All transactions are simulated and won't charge any real money.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Listing ID */}
            <div className="bg-white rounded-lg shadow p-6">
              <Label htmlFor="listingId" className="text-lg font-semibold mb-2 block">
                Listing ID
              </Label>
              <Input
                id="listingId"
                type="text"
                value={listingId}
                onChange={(e) => setListingId(e.target.value)}
                placeholder="Enter a listing ID to test promotions"
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-2">
                Enter the UUID of a listing from your database to test promotions on it.
              </p>
            </div>

            {/* Promotion Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Select Promotion Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {promotionTypes.map((feature) => (
                  <div
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedFeatures.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{feature.name}</h3>
                      {selectedFeatures.includes(feature.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <p className="font-bold text-blue-600">Rs. {feature.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              
              {selectedFeatures.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total:</span>
                    <span className="text-xl font-bold text-green-600">
                      Rs. {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Information (Test Data)</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Test Scenarios */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Test Scenario</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {testScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario.id as any)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedScenario === scenario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{scenario.icon}</span>
                      <h3 className="font-semibold">{scenario.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{scenario.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="bg-white rounded-lg shadow p-6">
              <Button
                onClick={handleTestPayment}
                disabled={loading || !listingId || selectedFeatures.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
                size="lg"
              >
                {loading ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Test Payment
                  </>
                )}
              </Button>
              
              {result && (
                <Button
                  onClick={resetTest}
                  variant="outline"
                  className="w-full mt-3"
                >
                  Reset Test
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Test Results
              </h2>

              {result ? (
                <div className={`p-4 rounded-lg ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 mb-3" />
                  )}
                  
                  <h3 className={`font-semibold mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Payment Successful!' : 'Payment Failed'}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-xs">{result.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs">{result.transactionId}</span>
                    </div>
                    
                    {result.paymentData && (
                      <>
                        <div className="flex justify-between mt-3 pt-3 border-t">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold">
                            Rs. {result.paymentData.amount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="text-gray-600">Features:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {result.paymentData.promotionTypes?.map((type: string) => (
                              <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No test results yet</p>
                  <p className="text-sm mt-2">Run a test payment to see results here</p>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-semibold mb-2">How to Use:</h3>
                <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Enter a valid listing ID</li>
                  <li>Select promotion features to test</li>
                  <li>Choose a test scenario</li>
                  <li>Click "Test Payment"</li>
                  <li>Check results and database</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


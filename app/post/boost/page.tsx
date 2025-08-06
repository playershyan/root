'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, Clock, Star, Zap, TrendingUp, 
  AlertCircle, Crown, Rocket, Eye, Users,
  Calendar, ChevronRight, Shield
} from 'lucide-react'

interface BoostOption {
  id: string
  name: string
  description: string
  icon: any
  price: number
  duration: string
  features: string[]
  popular?: boolean
  color: string
}

const boostOptions: BoostOption[] = [
  {
    id: 'bump-up',
    name: 'Daily Refresh',
    description: 'Keep your ad fresh and visible by moving it back to the top of search results',
    icon: TrendingUp,
    price: 500,
    duration: 'Per refresh',
    features: [
      'Move to top of search results',
      'Increased visibility for 24 hours',
      'Can be used multiple times',
      'Best for competitive categories'
    ],
    color: 'blue'
  },
  {
    id: 'top-ad',
    name: 'Premium Placement',
    description: 'Secure a premium spot at the very top of all relevant search results',
    icon: Crown,
    price: 2500,
    duration: '7 days',
    features: [
      'Guaranteed top position in searches',
      'Premium badge on your listing',
      '3x more views on average',
      'Priority in category pages',
      'Highlighted border'
    ],
    popular: true,
    color: 'purple'
  },
  {
    id: 'urgent',
    name: 'Urgent Sale',
    description: 'Let buyers know you need to sell quickly with an eye-catching urgent badge',
    icon: AlertCircle,
    price: 1000,
    duration: '14 days',
    features: [
      'Red "URGENT" badge on listing',
      'Higher ranking in searches',
      'Appeals to quick decision makers',
      'Included in urgent sales section'
    ],
    color: 'red'
  },
  {
    id: 'featured',
    name: 'Featured Showcase',
    description: 'Get maximum exposure with our complete promotional package',
    icon: Star,
    price: 5000,
    duration: '30 days',
    features: [
      'Homepage featured section',
      'Social media promotion',
      'Email newsletter inclusion',
      'Premium placement in searches',
      'Professional photo enhancement',
      'Detailed performance analytics'
    ],
    popular: true,
    color: 'amber'
  }
]

export default function BoostAdPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adId = searchParams.get('id') || 'new-ad'
  const adTitle = searchParams.get('title') || 'Your Vehicle'
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [showPayment, setShowPayment] = useState(false)

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const calculateTotal = () => {
    return selectedOptions.reduce((total, optionId) => {
      const option = boostOptions.find(opt => opt.id === optionId)
      return total + (option?.price || 0)
    }, 0)
  }

  const handleContinue = () => {
    if (selectedOptions.length > 0) {
      setShowPayment(true)
    } else {
      // Skip to confirmation if no options selected
      router.push(`/post/success?id=${adId}`)
    }
  }

  const handlePayment = () => {
    // Process payment
    console.log('Processing payment for:', selectedOptions)
    router.push(`/post/success?id=${adId}&boosted=true`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      <div className="bg-green-50 border-b border-green-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-green-900">
                Your ad has been submitted successfully!
              </h2>
              <p className="text-green-700 mt-1">
                <Clock className="w-4 h-4 inline mr-1" />
                It's under review and will go live within 6 hours. You'll receive an email confirmation once approved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Boost Your Ad for Maximum Visibility
          </h1>
          <p className="text-lg text-gray-600">
            Get up to <span className="font-semibold text-blue-600">10x more views</span> with our premium features
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Average views: <strong>156</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-500" />
              <span className="text-gray-600">Boosted views: <strong>1,560+</strong></span>
            </div>
          </div>
        </div>

        {!showPayment ? (
          <>
            {/* Boost Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {boostOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedOptions.includes(option.id)
                
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${
                        option.color === 'blue' ? 'bg-blue-100' :
                        option.color === 'purple' ? 'bg-purple-100' :
                        option.color === 'red' ? 'bg-red-100' :
                        'bg-amber-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          option.color === 'blue' ? 'text-blue-600' :
                          option.color === 'purple' ? 'text-purple-600' :
                          option.color === 'red' ? 'text-red-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {option.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {option.description}
                    </p>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        Rs. {option.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500">/ {option.duration}</span>
                    </div>
                    
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Why Boost Section */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Why boost your ad?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Reach More Buyers</p>
                    <p className="text-sm text-blue-700">Get in front of serious buyers actively looking</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Sell Faster</p>
                    <p className="text-sm text-blue-700">Boosted ads sell 3x faster on average</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900">Money-Back Guarantee</p>
                    <p className="text-sm text-blue-700">Full refund if your ad doesn't get approved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-gray-600">Selected features</p>
                  <p className="text-3xl font-bold text-gray-900">
                    Rs. {calculateTotal().toLocaleString()}
                  </p>
                </div>
                {selectedOptions.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{selectedOptions.length} features selected</p>
                    <button 
                      onClick={() => setSelectedOptions([])}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => router.push(`/post/success?id=${adId}`)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {selectedOptions.length > 0 ? 'Continue to Payment' : 'Continue Without Boosting'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                You can always boost your ad later from your dashboard
              </p>
            </div>
          </>
        ) : (
          /* Payment Section */
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-6">Complete Your Purchase</h2>
              
              {/* Order Summary */}
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-3">Order Summary</h3>
                {selectedOptions.map(optionId => {
                  const option = boostOptions.find(opt => opt.id === optionId)
                  if (!option) return null
                  
                  return (
                    <div key={optionId} className="flex justify-between py-2">
                      <span className="text-gray-700">{option.name}</span>
                      <span className="font-medium">Rs. {option.price.toLocaleString()}</span>
                    </div>
                  )
                })}
                <div className="border-t mt-3 pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold text-lg">Rs. {calculateTotal().toLocaleString()}</span>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" defaultChecked className="w-4 h-4" />
                  <span className="font-medium">Credit/Debit Card</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="w-4 h-4" />
                  <span className="font-medium">Bank Transfer</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" className="w-4 h-4" />
                  <span className="font-medium">Mobile Money</span>
                </label>
              </div>
              
              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Complete Payment
              </button>
              
              <button
                onClick={() => setShowPayment(false)}
                className="w-full mt-3 text-gray-600 hover:text-gray-800"
              >
                Back to options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
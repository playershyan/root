'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, Clock, Star, Zap, TrendingUp, 
  AlertCircle, Crown, Target, Eye, Users,
  Calendar, ChevronRight, Shield, Search
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
    id: 'featured',
    name: 'Featured Request',
    description: 'Get maximum exposure with prominent placement across the platform',
    icon: Star,
    price: 3000,
    duration: '30 days',
    features: [
      'Featured badge on your request',
      'Top placement in wanted section',
      'Included in daily seller alerts',
      'Homepage featured requests',
      'Priority in search results',
      '5x more dealer views'
    ],
    popular: true,
    color: 'amber'
  },
  {
    id: 'high-priority',
    name: 'High Priority',
    description: 'Mark your request as high priority to attract immediate seller attention',
    icon: AlertCircle,
    price: 1500,
    duration: '14 days',
    features: [
      'Red "HIGH PRIORITY" badge',
      'Urgent buyer indicator',
      'Top of seller notifications',
      'SMS alerts to matching sellers',
      'Priority support from team'
    ],
    color: 'red'
  },
  {
    id: 'bump-up',
    name: 'Bump Up',
    description: 'Refresh your request to the top of the list and re-notify sellers',
    icon: TrendingUp,
    price: 750,
    duration: 'Per bump',
    features: [
      'Move to top of wanted list',
      'Re-send notifications to sellers',
      'Fresh timestamp',
      'Renewed visibility for 48 hours',
      'Can use multiple times'
    ],
    color: 'blue'
  }
]

export default function BoostWantedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestId = searchParams.get('id') || 'new-request'
  const requestTitle = searchParams.get('title') || 'Your Vehicle Request'
  
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
      router.push(`/wanted/success?id=${requestId}`)
    }
  }

  const handlePayment = () => {
    console.log('Processing payment for:', selectedOptions)
    router.push(`/wanted/success?id=${requestId}&boosted=true`)
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
                Your wanted request has been posted successfully!
              </h2>
              <p className="text-green-700 mt-1">
                <Clock className="w-4 h-4 inline mr-1" />
                It's under review and will be visible to sellers within 6 hours. We'll notify matching sellers immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Get Sellers to Contact You Faster
          </h1>
          <p className="text-lg text-gray-600">
            Boost your wanted request to get <span className="font-semibold text-blue-600">3x more seller responses</span>
          </p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Average responses: <strong>2-3</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-gray-600">Boosted responses: <strong>8-12</strong></span>
            </div>
          </div>
        </div>

        {!showPayment ? (
          <>
            {/* Boost Options */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {boostOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedOptions.includes(option.id)
                
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleOption(option.id)}
                    className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          RECOMMENDED
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className={`inline-flex p-4 rounded-full mb-4 ${
                        option.color === 'blue' ? 'bg-blue-100' :
                        option.color === 'red' ? 'bg-red-100' :
                        'bg-amber-100'
                      }`}>
                        <Icon className={`w-8 h-8 ${
                          option.color === 'blue' ? 'text-blue-600' :
                          option.color === 'red' ? 'text-red-600' :
                          'text-amber-600'
                        }`} />
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {option.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {option.description}
                      </p>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-3xl font-bold text-gray-900">
                          Rs. {option.price.toLocaleString()}
                        </span>
                        <span className="text-gray-500">/ {option.duration}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <button className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Success Stories */}
            <div className="bg-amber-50 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Why boost your wanted request?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <blockquote className="text-sm text-amber-800 italic">
                    "Got 8 dealer responses within 2 days of posting my featured request. Found exactly what I was looking for!"
                  </blockquote>
                  <p className="text-sm text-amber-700 mt-2 font-medium">- Rajesh, Colombo</p>
                </div>
                <div>
                  <blockquote className="text-sm text-amber-800 italic">
                    "The high priority badge really works! Sellers contacted me immediately with great offers."
                  </blockquote>
                  <p className="text-sm text-amber-700 mt-2 font-medium">- Sarah, Kandy</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-3xl font-bold text-blue-600 mb-1">87%</div>
                <p className="text-sm text-gray-600">Find their vehicle within a week</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-3xl font-bold text-green-600 mb-1">3.5x</div>
                <p className="text-sm text-gray-600">More seller responses on average</p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border">
                <div className="text-3xl font-bold text-purple-600 mb-1">24hrs</div>
                <p className="text-sm text-gray-600">Average time to first response</p>
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
                  onClick={() => router.push(`/wanted/success?id=${requestId}`)}
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
                You can always boost your request later from your dashboard
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
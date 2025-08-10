'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WantedRequestPaidFeatures() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const features = [
    {
      id: 'featured',
      name: 'Featured',
      price: 'Rs. 3,500',
      duration: '7 days',
      icon: 'fas fa-star',
      color: 'bg-yellow-500',
      description: 'The pinnacle of wanted request promotion! Featured requests get exclusive placement in the top 2 spots of wanted listings and homepage visibility with premium formatting.',
      benefits: [
        'Exclusive top 2 spots in wanted request listings',
        'Featured placement on site homepage',
        'Premium request format with enhanced design',
        'Maximum exposure across the entire platform',
        'Up to 15x more responses from sellers',
        'Priority customer support'
      ]
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      price: 'Rs. 1,200',
      duration: '3 days',
      icon: 'fas fa-exclamation-circle',
      color: 'bg-red-500',
      description: 'Mark your request as high priority to communicate urgency and attract immediate attention from sellers.',
      benefits: [
        'Bright red priority marker on your request',
        'Special high priority filter for sellers',
        'Combines well with other promotions',
        'Conveys urgency to potential sellers'
      ]
    },
    {
      id: 'boost',
      name: 'Boost',
      price: 'Rs. 500',
      duration: '5 days',
      icon: 'fas fa-arrow-up',
      color: 'bg-blue-500',
      description: 'Boost your wanted request to the top of listings daily and get significantly more visibility from sellers.',
      benefits: [
        'Daily boost to top of wanted request listings',
        'Up to 8x more views than regular requests',
        'Automatic daily repositioning',
        'Increased seller engagement'
      ]
    }
  ]

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const getTotalPrice = () => {
    return features
      .filter(feature => selectedFeatures.includes(feature.id))
      .reduce((total, feature) => total + parseInt(feature.price.replace('Rs. ', '').replace(',', '')), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <i className="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
            <div>
              <h2 className="text-xl font-bold text-green-800">Your wanted request is live!</h2>
              <p className="text-green-700 mt-1">
                Great! Your wanted request has been published and sellers can now find it. 
                Boost your chances of finding what you're looking for with our premium features below.
              </p>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Get More Responses with Premium Features
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stand out from the crowd and get faster responses from sellers. 
            Choose the features that work best for your wanted request.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className={`relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${
                selectedFeatures.includes(feature.id) 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleFeature(feature.id)}
            >
              {/* Selection Indicator */}
              {selectedFeatures.includes(feature.id) && (
                <div className="absolute top-4 right-4">
                  <i className="fas fa-check-circle text-blue-500 text-xl"></i>
                </div>
              )}

              <div className="p-6">
                {/* Feature Icon & Name */}
                <div className="flex items-center mb-4">
                  <div className={`${feature.color} text-white rounded-full p-3 mr-3`}>
                    <i className={`${feature.icon} text-lg`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-600">{feature.duration}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-2xl font-bold text-gray-900 mb-3">
                  {feature.price}
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Benefits */}
                <div className="space-y-2">
                  {feature.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <i className="fas fa-check text-green-500 text-xs mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              {selectedFeatures.length > 0 ? (
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Total: Rs. {getTotalPrice().toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedFeatures.length} feature{selectedFeatures.length > 1 ? 's' : ''} selected
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">No features selected</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Link 
                href="/wanted-requests"
                className="btn-quaternary"
              >
                Skip for Now
              </Link>
              
              {selectedFeatures.length > 0 && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    // Handle payment/checkout logic here
                    console.log('Selected features:', selectedFeatures)
                  }}
                >
                  <i className="fas fa-credit-card mr-2"></i>
                  Proceed to Payment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            All promotions are processed instantly after payment confirmation
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span><i className="fas fa-shield-alt mr-1"></i> Secure Payment</span>
            <span><i className="fas fa-clock mr-1"></i> Instant Activation</span>
            <span><i className="fas fa-headset mr-1"></i> 24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}
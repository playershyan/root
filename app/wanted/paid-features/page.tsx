'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import PaymentModal from '@/app/components/payments/PaymentModal'
import { PromotionType } from '@/lib/services/promotionService'

export default function WantedPaidFeatures() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isNewPost, setIsNewPost] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const requestId = searchParams.get('request')
  
  useEffect(() => {
    // Check if coming from new post flow
    const fromNewPost = searchParams.get('new') === 'true'
    setIsNewPost(fromNewPost)
  }, [searchParams])

  const features = [
    {
      id: 'boost',
      name: 'Boost',
      price: 'Rs. 800',
      duration: '7 days',
      icon: 'fas fa-arrow-up',
      color: 'bg-blue-500',
      description: 'Push your wanted request to the top of listings daily for maximum visibility.',
      benefits: [
        'Daily repositioning to top of listings',
        'Up to 10x more views than standard requests',
        'Automatic daily refresh cycle',
        'Stays active for full promotion duration'
      ]
    },
    {
      id: 'top-spot',
      name: 'Top Spot',
      price: 'Rs. 1,200',
      duration: '7 days',
      icon: 'fas fa-crown',
      color: 'bg-purple-600',
      description: 'Secure a top position at the beginning of every category page with enhanced design.',
      benefits: [
        'Reserved top slots at page beginning',
        'Larger request size with enhanced visibility',
        'Distinctive golden highlighting',
        'Up to 5x more engagement than regular requests'
      ]
    },
    {
      id: 'urgent',
      name: 'Urgent',
      price: 'Rs. 600',
      duration: '5 days',
      icon: 'fas fa-exclamation-triangle',
      color: 'bg-red-500',
      description: 'Mark your request as urgent to communicate immediate buying intent.',
      benefits: [
        'Bright red urgent marker on your request',
        'Dedicated urgent filter for sellers',
        'Perfect for urgent purchases',
        'Combines effectively with other promotions'
      ]
    },
    {
      id: 'featured',
      name: 'Featured',
      price: 'Rs. 3,500',
      duration: '7 days',
      icon: 'fas fa-star',
      color: 'bg-yellow-500',
      description: 'The pinnacle of request promotion! Featured requests get exclusive placement in the top 2 spots.',
      benefits: [
        'Exclusive top 2 spots in relevant categories',
        'Featured placement on site homepage',
        'Premium request format with enhanced design',
        'Maximum exposure across the entire platform',
        'Up to 15x more views than regular requests'
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

  const handlePayment = () => {
    if (!requestId) {
      toast.error('No wanted request ID provided')
      return
    }

    if (selectedFeatures.length === 0) {
      toast.error('Please select at least one promotion feature')
      return
    }

    // Open payment modal
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    // Success - redirect to profile with success message
    const featuresParam = selectedFeatures.join(',')
    router.push(`/profile?tab=wanted&payment=success&features=${featuresParam}&type=wanted`)
  }

  // Map feature IDs to PromotionType
  const getPromotionTypes = (): PromotionType[] => {
    return selectedFeatures.map(f => {
      if (f === 'top-spot') return 'top_spot'
      return f as PromotionType
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message - Only show when coming from new post flow */}
        {isNewPost && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <i className="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
              <div>
                <h2 className="text-xl font-bold text-green-800">Wanted request submitted successfully!</h2>
                <p className="text-green-700 mt-1">
                  Congratulations! Your wanted request has been submitted and is currently under review. 
                  Maximize your buying potential with our powerful promotion features below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Supercharge Your Wanted Request with Premium Promotions
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Get more responses, more visibility, and find your perfect vehicle faster with our proven promotion features. 
            Choose the right combination to maximize your request's performance.
          </p>
          {isNewPost && (
            <p className="text-sm text-blue-600 mt-4 font-medium">
              <i className="fas fa-info-circle mr-1"></i>
              You can always apply these features later from My Profile → My Wanted Requests
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="absolute top-4 right-4 z-10">
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
                    <h3 className="text-lg font-bold text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-600">{feature.duration}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-xl font-bold text-gray-900 mb-3">
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
                      <span className="text-xs text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popular Combinations */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            <i className="fas fa-fire text-orange-500 mr-2"></i>
            Popular Combinations
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Quick Find</h4>
              <p className="text-sm text-gray-600 mb-2">Boost + Urgent</p>
              <p className="text-lg font-bold text-blue-600">Rs. 1,400</p>
              <p className="text-xs text-gray-500">Save Rs. 200</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Maximum Visibility</h4>
              <p className="text-sm text-gray-600 mb-2">Top Spot + Featured</p>
              <p className="text-lg font-bold text-blue-600">Rs. 4,200</p>
              <p className="text-xs text-gray-500">Save Rs. 500</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Complete Package</h4>
              <p className="text-sm text-gray-600 mb-2">All Features</p>
              <p className="text-lg font-bold text-blue-600">Rs. 5,500</p>
              <p className="text-xs text-gray-500">Save Rs. 600</p>
            </div>
          </div>
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
                href="/wanted"
                className="btn-quaternary"
              >
                Skip for Now
              </Link>
              
              {selectedFeatures.length > 0 && (
                <button
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handlePayment}
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
            All promotions activate immediately upon payment confirmation and start working within minutes
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <span><i className="fas fa-shield-alt mr-1"></i> Secure Payment</span>
            <span><i className="fas fa-bolt mr-1"></i> Instant Activation</span>
            <span><i className="fas fa-chart-line mr-1"></i> Real-time Analytics</span>
            <span><i className="fas fa-headset mr-1"></i> 24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {requestId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          listingId={requestId} // Using listingId prop for compatibility, but entityId will override
          selectedFeatures={getPromotionTypes()}
          totalAmount={getTotalPrice()}
          onSuccess={handlePaymentSuccess}
          entityType="wanted"
          entityId={requestId}
        />
      )}
    </div>
  )
}


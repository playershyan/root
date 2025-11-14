'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Share2, Phone, MessageCircle, MessageSquare, MapPin, Calendar, Eye, Check, ChevronLeft, ChevronRight, Star, Calculator, Activity, Fuel, Settings, Handshake, Info } from 'lucide-react'
import ContactProfile from '../../components/ContactProfile'
import PriceDisplay from '../../components/PriceDisplay'
import FavoriteButton from '@/app/components/FavoriteButton'
import OfferModal from '@/app/components/messaging/OfferModal'
import { useAuth } from '@/app/contexts/AuthContext'
import ConversationModal from '@/app/components/modals/ConversationModal'
import ImageLightbox from '@/app/components/ImageLightbox'
import OptimizedImage from '@/components/ui/OptimizedImage'
import ContactModal from '@/app/components/modals/ContactModal'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'
import AuthModal from '@/app/components/auth/AuthModal'
import { useAuthWithRedirect } from '@/app/hooks/useAuthWithRedirect'
import { logger } from '@/lib/utils/logger'

type Listing = {
  id: string
  title: string
  description: string | null
  ai_generated_description: string | null
  ai_summary: string | null
  price: number
  make: string
  model: string
  year: number
  mileage: number | null
  fuel_type: string | null
  transmission: string | null
  engine_capacity?: number | null
  body_type?: string | null
  color?: string | null
  condition?: string | null
  features?: string[] | null
  location: string
  phone: string
  whatsapp: string | null
  email: string | null
  image_url: string | null
  image_urls: string[] | null
  is_featured: boolean
  is_sold: boolean
  views: number
  created_at: string
  updated_at: string
  user_id?: string // Add user_id for messaging
  seller_type?: 'dealer' | 'private'
  seller_name?: string
  pricing_type?: 'cash' | 'finance'
  finance_type?: string
  finance_provider?: string
  original_amount?: number
  outstanding_balance?: number
  asking_price?: number
  monthly_payment?: number
  remaining_term?: string
  early_settlement?: string
  negotiable?: boolean
}

type Dealer = {
  name: string
  rating: number
  reviewCount: number
  location: string
  phone: string
  whatsapp: string
  avatar: string | null
}

type Features = {
  safety: string[]
  technology: string[]
  comfort: string[]
  performance: string[]
}

interface ListingDetailClientProps {
  listing: Listing
  images: string[]
  dealer: Dealer
  sellerData: any // Enhanced seller data from profile
  features: Features
  specifications: Record<string, string | number>
  similarListings: Listing[]
}

export default function ListingDetailClient({
  listing,
  images,
  dealer,
  sellerData,
  features,
  specifications,
  similarListings
}: ListingDetailClientProps) {
  const { user } = useAuth()
  const { toasts, showSuccess, showError, removeToast } = useToast()
  const { showAuthModal, openAuthWithAction, closeAuth, handleAuthSuccess } = useAuthWithRedirect()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showConversationModal, setShowConversationModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  // Finance Calculator States
  const [loanAmount, setLoanAmount] = useState(listing.price)
  const [downPayment, setDownPayment] = useState(0)
  const [loanTerm, setLoanTerm] = useState(5)
  const [interestRate, setInterestRate] = useState(0)

  // Check for pending action after OAuth redirect
  useEffect(() => {
    const pendingAction = localStorage.getItem('pendingAction')
    if (pendingAction === 'make-offer' && user) {
      localStorage.removeItem('pendingAction')
      localStorage.removeItem('pendingRedirect')
      localStorage.removeItem('pendingActionData')
      setTimeout(() => setShowOfferModal(true), 300)
    }
  }, [user])

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const principal = loanAmount - downPayment
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTerm * 12
    
    if (principal > 0 && monthlyRate > 0 && numPayments > 0) {
      const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1)
      return Math.round(payment)
    }
    return null
  }

  const monthlyPayment = calculateMonthlyPayment()

  // Offer handling
  const handleSendOffer = async (amount: number, message?: string) => {
    if (!user || !listing.user_id) {
      throw new Error('Authentication required')
    }

    try {
      const response = await fetch('/api/messaging/send-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.user_id,
          amount,
          message,
          listingTitle: listing.title
        })
      })

      const result = await response.json()

      if (!response.ok) {
        logger.error('Failed to send offer', new Error(result.message || result.error), {
          component: 'ListingDetailClient',
          action: 'handleSendOffer',
          listingId: listing.id,
          status: response.status
        })
        const errorMessage = result.message || result.error || 'Failed to send offer'
        showError(errorMessage)
        throw new Error(errorMessage)
      }

      logger.debug('Offer sent successfully', {
        component: 'ListingDetailClient',
        action: 'handleSendOffer',
        listingId: listing.id,
        amount
      })
      showSuccess('Offer sent successfully! The seller will be notified.')
    } catch (error) {
      logger.error('Error sending offer', error as Error, {
        component: 'ListingDetailClient',
        action: 'handleSendOffer',
        listingId: listing.id
      })
      if (error instanceof Error && !error.message.includes('Failed to send offer')) {
        showError('An unexpected error occurred. Please try again.')
      }
      throw error
    }
  }

  const handleMakeOffer = () => {
    if (!user) {
      openAuthWithAction(() => setShowOfferModal(true), 'make-offer')
      return
    }

    if (user.id === listing.user_id) {
      showError('You cannot make an offer on your own listing')
      return
    }

    setShowOfferModal(true)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this ${listing.make} ${listing.model} for Rs. ${listing.price.toLocaleString()}`,
          url: window.location.href,
        })
      } catch (err) {
        logger.debug('Error sharing', { error: err })
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  return (
    <>
      {/* Vehicle Top Section - Full Width */}
      <div className="lg:bg-white lg:rounded-xl lg:shadow-sm overflow-hidden mb-2 lg:mb-6 bg-white lg:bg-white border-b lg:border">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-2 lg:gap-6 px-4 lg:p-6 py-4 lg:py-6">
            {/* Image Gallery */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <>
                  <div
                    className="relative h-full w-full cursor-pointer"
                    onClick={() => openLightbox(currentImageIndex)}
                  >
                    <OptimizedImage
                      src={images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover md:object-contain"
                      quality="gallery"
                      watermark={true}
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                    />
                  </div>
                  
                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* View Count */}
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{listing.views || 0} views</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-20 h-20 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No images available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => openLightbox(index)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      index === currentImageIndex ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="relative w-full h-full">
                      <OptimizedImage
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        quality="listing"
                        watermark={true}
                        sizes="80px"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Header Info */}
          <div className="flex flex-col">
            {/* Title and Actions */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {listing.title}
                </h1>
                <p className="text-sm text-gray-600 italic">
                  Posted on {listing.created_at.split('T')[0]}
                </p>
              </div>
              <div className="flex gap-2">
                <FavoriteButton 
                  listingId={listing.id}
                  size="medium"
                  className="rounded-full hover:bg-gray-100 transition-colors"
                />
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Share listing"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Key Details Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <Calendar className="mr-1" size={16} /> {listing.year}
              </span>
              {listing.mileage && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Activity className="mr-1" size={16} /> {listing.mileage.toLocaleString()} km
                </span>
              )}
              {listing.fuel_type && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Fuel className="mr-1" size={16} /> {listing.fuel_type}
                </span>
              )}
              {listing.transmission && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  <Settings className="mr-1" size={16} /> {listing.transmission}
                </span>
              )}
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <MapPin className="mr-1" size={16} /> {listing.location}
              </span>
              {listing.pricing_type === 'finance' && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                  <Handshake className="mr-1" size={16} /> Finance Takeover
                </span>
              )}
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <PriceDisplay
                pricingType={listing.pricing_type}
                price={listing.price}
                negotiable={listing.negotiable}
                financeType={listing.finance_type}
                outstandingBalance={listing.outstanding_balance}
                askingPrice={listing.asking_price}
                monthlyPayment={listing.monthly_payment}
                remainingTerm={listing.remaining_term}
                showFinanceCalculator={true}
                calculatedMonthlyPayment={monthlyPayment}
                variant="detail"
              />
            </div>

            {/* Seller Information & Actions - Mobile Only */}
            <div className="lg:hidden mb-6 space-y-4">
              {/* Seller Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                {sellerData?.type === 'business' ? (
                  <>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center border border-gray-200">
                      {(sellerData.profileImageUrl || sellerData.logoUrl) ? (
                        <img
                          src={sellerData.profileImageUrl || sellerData.logoUrl}
                          alt={sellerData.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/business/${sellerData.businessId}`}
                        className="font-semibold text-gray-900 hover:text-blue-600 transition-colors flex items-center gap-2"
                      >
                        {sellerData.name}
                        {sellerData.isVerified && (
                          <Check className="w-4 h-4 text-blue-600 bg-blue-50 rounded-full p-0.5" />
                        )}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">Business Seller</p>
                    </div>
                  </>
                ) : sellerData?.type === 'individual' ? (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      <span>
                        {sellerData.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{sellerData.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Private Seller</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center font-medium text-sm">
                      <span>
                        {dealer.name.split(' ').map((n: string) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{dealer.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Seller</p>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="btn-call btn-full btn-icon"
                >
                  <Phone className="w-4 h-4" />
                  Contact
                </button>
                <button
                  onClick={() => setShowConversationModal(true)}
                  className="btn-message btn-full btn-icon"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              </div>

              {/* Make Offer Button */}
              <button
                onClick={handleMakeOffer}
                className="btn-secondary btn-full"
              >
                Make Offer
              </button>
            </div>

            {/* Make Offer Button - Desktop Only */}
            <button
              onClick={handleMakeOffer}
              className="hidden lg:block btn-secondary btn-full"
            >
              Make Offer
            </button>

          </div>
        </div>
      </div>

      {/* Main Content Area and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-2 lg:gap-6">
        {/* Main Content */}
        <div className="space-y-2 lg:space-y-6">
          {/* Description Section */}
          <div className="bg-white lg:bg-white lg:rounded-xl lg:shadow-sm px-4 lg:p-6 py-4 lg:py-6 border-b lg:border">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <div className="text-gray-700 whitespace-pre-line mb-6">
              {(listing.description || listing.ai_generated_description || 'No description available.')
                .split('\n')
                .map((line, index) => {
                  const trimmedLine = line.trim()

                  // First line (title) - make it bold if it doesn't contain a colon
                  if (index === 0 && !trimmedLine.includes(':')) {
                    return (
                      <div key={index} className="font-bold text-gray-900 text-base mb-2">
                        {trimmedLine}
                      </div>
                    )
                  }

                  // Lines with "Field: Value" format - make field name bold
                  if (trimmedLine.includes(':')) {
                    // Check if line contains pipe separator (multiple field:value pairs)
                    if (trimmedLine.includes('|')) {
                      // Split by pipe and format each field:value pair separately
                      const parts = trimmedLine.split('|')
                      return (
                        <div key={index}>
                          {parts.map((part, partIndex) => {
                            const trimmedPart = part.trim()
                            const colonIndex = trimmedPart.indexOf(':')
                            if (colonIndex > 0) {
                              const fieldName = trimmedPart.substring(0, colonIndex).trim()
                              const fieldValue = trimmedPart.substring(colonIndex + 1).trim()
                              return (
                                <span key={partIndex}>
                                  {partIndex > 0 && ' | '}
                                  <strong className="font-semibold text-gray-900">{fieldName}:</strong>
                                  {fieldValue && <span> {fieldValue}</span>}
                                </span>
                              )
                            }
                            return <span key={partIndex}>{trimmedPart}</span>
                          })}
                        </div>
                      )
                    } else {
                      // Single field:value pair on the line
                      const colonIndex = trimmedLine.indexOf(':')
                      const fieldName = trimmedLine.substring(0, colonIndex)
                      const fieldValue = trimmedLine.substring(colonIndex + 1).trim()

                      return (
                        <div key={index}>
                          <strong className="font-semibold text-gray-900">{fieldName}:</strong>
                          {fieldValue && <span> {fieldValue}</span>}
                        </div>
                      )
                    }
                  }

                  // Regular lines
                  return (
                    <div key={index}>
                      {trimmedLine}
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Specifications Section */}
          <div className="bg-white lg:bg-white lg:rounded-xl lg:shadow-sm px-4 lg:p-6 py-4 lg:py-6 border-b lg:border">
            <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(specifications).map(([label, value]) => (
                <div key={label} className="bg-gray-50 p-3 rounded-lg">
                  {/* Mobile view: Title: value */}
                  <div className="sm:hidden">
                    <p className="text-sm text-gray-900">
                      <span className="text-gray-600">{label}:</span> <span className="font-semibold">{value}</span>
                    </p>
                  </div>
                  {/* Desktop view: Title above value */}
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section - Only show if there are features */}
          {Object.values(features).some(items => items.length > 0) && (
            <div className="bg-white lg:bg-white lg:rounded-xl lg:shadow-sm px-4 lg:p-6 py-4 lg:py-6 border-b lg:border">
              <h2 className="text-xl font-semibold mb-4">Features & Equipment</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(features)
                  .filter(([_, items]) => items.length > 0)
                  .map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 text-blue-600 capitalize">
                        {category === 'other' ? 'Additional Features' : category}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-2 lg:space-y-6">
          {/* Contact Profile - Dynamic based on seller type - Desktop Only */}
          <div className="hidden lg:block">
            <ContactProfile
              listing={listing}
              sellerData={sellerData}
              dealer={dealer}
              onMessageClick={() => setShowConversationModal(true)}
            />
          </div>

          {/* Important Information */}
          <div className="mt-4 lg:mt-12 bg-yellow-50 border-b lg:border border-yellow-200 lg:rounded-xl px-4 lg:p-6 py-4 lg:py-6">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Information</h3>
            <ul className="space-y-1 text-sm text-yellow-800">
              <li>• Always verify vehicle documents before making a purchase</li>
              <li>• Request a professional inspection if possible</li>
              <li>• Check service history and ownership records</li>
              <li>• Never make any form of payment without meeting in person first</li>
            </ul>
          </div>

          {/* Finance Calculator */}
          <div className="bg-white lg:bg-white lg:rounded-xl lg:shadow-sm px-4 lg:p-6 py-4 lg:py-6 border-b lg:border" id="finance-calculator">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Finance Calculator
                </h2>
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold rounded-full">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-gray-500 italic">
                Complete all fields below to calculate your estimated monthly payment
              </p>
            </div>
            
            {listing.pricing_type === 'finance' && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-sm text-amber-800">
                  <Info className="mr-1" size={16} />
                  This vehicle has an existing finance. You can either take over the current loan or calculate your own financing after settling the outstanding balance.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">
                  {listing.pricing_type === 'finance' ? 'Settlement Amount / Vehicle Price' : 'Vehicle Price'}
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Down Payment</label>
                <input
                  type="number"
                  value={downPayment || ''}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter amount"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Loan Term (Years)</label>
                <select
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(year => (
                    <option key={year} value={year}>{year} Year{year > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Interest Rate (%)</label>
                <input
                  type="number"
                  value={interestRate || ''}
                  step="0.1"
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter rate"
                />
              </div>
            </div>

            {monthlyPayment && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Estimated Monthly Payment</p>
                <p className="text-2xl font-bold text-blue-600">
                  Rs. {monthlyPayment.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  *This is an estimate. Actual rates may vary.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Similar Vehicles Section */}
      {similarListings.length > 0 && (
        <div className="mt-4 lg:mt-12">
          <h2 className="text-2xl font-bold mb-4 lg:mb-6 px-4 lg:px-0">Similar Vehicles</h2>

          {/* Desktop Grid Layout */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6 px-4 lg:px-0">
            {similarListings.slice(0, 6).map((similar) => (
              <Link
                key={similar.id}
                href={`/listings/${similar.id}`}
                className="bg-white lg:rounded-xl lg:shadow-sm overflow-hidden lg:hover:shadow-lg transition-all group border-b md:border"
              >
                <div className="aspect-w-16 aspect-h-12 bg-gray-200 h-48">
                  {similar.image_url || (similar.image_urls && similar.image_urls[0]) ? (
                    <img
                      src={similar.image_url || similar.image_urls![0]}
                      alt={similar.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder/400/300'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {similar.title}
                  </h3>
                  {similar.pricing_type === 'finance' && (
                    <div className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium mt-1">
                      <Handshake className="mr-1" size={16} /> Finance Takeover
                    </div>
                  )}
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    Rs. {similar.price.toLocaleString()}
                    {similar.pricing_type === 'finance' && similar.finance_type === 'transfer' && similar.outstanding_balance && (
                      <span className="text-xs text-gray-500 block">
                        + Rs. {similar.outstanding_balance.toLocaleString()} outstanding
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{similar.year}</span>
                    <span>•</span>
                    <span>{similar.mileage?.toLocaleString() || 'N/A'} km</span>
                    <span>•</span>
                    <span>{similar.fuel_type || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1"><MapPin className="mr-1" size={16} /> {similar.location}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile Horizontal Scroll Layout */}
          <div className="md:hidden">
            <div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
              style={{
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {similarListings.map((similar) => (
                <Link
                  key={similar.id}
                  href={`/listings/${similar.id}`}
                  className="flex-none w-[calc(50%-8px)] bg-white rounded-xl shadow-sm overflow-hidden"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="bg-gray-200 h-32">
                    {similar.image_url || (similar.image_urls && similar.image_urls[0]) ? (
                      <img
                        src={similar.image_url || similar.image_urls![0]}
                        alt={similar.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/api/placeholder/400/300'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
                      {similar.title}
                    </h3>
                    {similar.pricing_type === 'finance' && (
                      <div className="inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium mt-0.5">
                        <Handshake className="mr-0.5" size={10} /> Finance
                      </div>
                    )}
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      Rs. {similar.price.toLocaleString()}
                      {similar.pricing_type === 'finance' && similar.finance_type === 'transfer' && similar.outstanding_balance && (
                        <span className="text-xs text-gray-500 block">
                          + Rs. {similar.outstanding_balance.toLocaleString()}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                      <span>{similar.year}</span>
                      <span>•</span>
                      <span>{similar.mileage?.toLocaleString() || 'N/A'} km</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      <MapPin className="mr-1" size={16} /> {similar.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

{/* Conversation Modal */}
      <ConversationModal
        isOpen={showConversationModal}
        onClose={() => setShowConversationModal(false)}
        listing={{
          id: listing.id,
          title: listing.title,
          price: listing.price,
          location: listing.location,
          make: listing.make,
          model: listing.model,
          year: listing.year,
          primary_image_url: images[0] || listing.image_url,
          user_id: listing.user_id || ""
        }}
      />

      {/* Contact Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        listing={{
          id: listing.id,
          title: listing.title,
          phone: sellerData?.phone || dealer.phone || listing.phone,
          whatsapp: sellerData?.type === 'business' ? sellerData.whatsapp : sellerData?.whatsapp || dealer.whatsapp || listing.whatsapp,
          price: listing.price,
          location: listing.location,
          make: listing.make,
          model: listing.model,
          year: listing.year
        }}
      />

      {/* Offer Modal */}
      <OfferModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        onSendOffer={handleSendOffer}
        listingTitle={listing.title}
        listingPrice={listing.price}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={setLightboxIndex}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuth}
        initialView="login"
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
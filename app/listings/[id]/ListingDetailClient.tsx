'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Share2, Phone, MessageCircle, MapPin, Calendar, Eye, Check, ChevronLeft, ChevronRight, Star, Calculator } from 'lucide-react'

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
}

type Dealer = {
  name: string
  rating: number
  reviewCount: number
  location: string
  phone: string
  whatsapp: string
  avatar: string | null
  responseTime: string
}

type Features = {
  safety: string[]
  technology: string[]
  comfort: string[]
  performance: string[]
}

type VehicleHistory = {
  date: string
  type: string
  description: string
  mileage: number
}[]

interface ListingDetailClientProps {
  listing: Listing
  images: string[]
  dealer: Dealer
  features: Features
  specifications: Record<string, string | number>
  vehicleHistory: VehicleHistory
  similarListings: Listing[]
}

export default function ListingDetailClient({
  listing,
  images,
  dealer,
  features,
  specifications,
  vehicleHistory,
  similarListings
}: ListingDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showContactInfo, setShowContactInfo] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'features' | 'history'>('description')
  
  // Finance Calculator States
  const [loanAmount, setLoanAmount] = useState(listing.price)
  const [downPayment, setDownPayment] = useState(Math.round(listing.price * 0.2))
  const [loanTerm, setLoanTerm] = useState(5)
  const [interestRate, setInterestRate] = useState(12)
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null)

  // Calculate monthly payment
  const calculatePayment = () => {
    const principal = loanAmount - downPayment
    const monthlyRate = interestRate / 100 / 12
    const numPayments = loanTerm * 12
    
    if (principal > 0 && monthlyRate > 0 && numPayments > 0) {
      const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1)
      setMonthlyPayment(Math.round(payment))
    }
  }

  useEffect(() => {
    calculatePayment()
  }, [loanAmount, downPayment, loanTerm, interestRate])

  // Load favorite status from localStorage
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setIsFavorite(favorites.includes(listing.id))
  }, [listing.id])

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (isFavorite) {
      const newFavorites = favorites.filter((id: string) => id !== listing.id)
      localStorage.setItem('favorites', JSON.stringify(newFavorites))
    } else {
      localStorage.setItem('favorites', JSON.stringify([...favorites, listing.id]))
    }
    setIsFavorite(!isFavorite)
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
        console.log('Error sharing:', err)
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

  const formatPhoneNumber = (phone: string) => {
    // Format phone for WhatsApp (remove spaces and add country code if needed)
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.startsWith('94') ? cleaned : `94${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`
  }

  return (
    <>
      {/* Vehicle Top Section - Full Width */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 p-6">
          {/* Image Gallery */}
          <div className="relative">
            {/* Main Image */}
            <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/api/placeholder/800/600'
                    }}
                  />
                  
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
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/api/placeholder/80/60'
                      }}
                    />
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
                  Posted {new Date(listing.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Add to favorites"
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
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
                <i className="fas fa-calendar-alt mr-1"></i> {listing.year}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <i className="fas fa-road mr-1"></i> {listing.mileage?.toLocaleString() || 'N/A'} km
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <i className="fas fa-gas-pump mr-1"></i> {listing.fuel_type || 'N/A'}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <i className="fas fa-cog mr-1"></i> {listing.transmission || 'N/A'}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <i className="fas fa-map-marker-alt mr-1"></i> {listing.location}
              </span>
            </div>

            {/* Price Section */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-blue-600">
                Rs. {listing.price.toLocaleString()}
              </p>
              {monthlyPayment && (
                <p className="text-sm text-gray-600 mt-2">
                  From Rs. {monthlyPayment.toLocaleString()}/month
                  <Link href="#finance-calculator" className="text-blue-600 hover:underline ml-1">
                    Calculate financing →
                  </Link>
                </p>
              )}
            </div>

            {/* AI Summary if available */}
            {listing.ai_summary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <i className="fas fa-magic text-blue-600"></i>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-700">{listing.ai_summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b">
              <div className="flex space-x-8 px-6">
                {(['description', 'specs', 'features', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line mb-6">
                    {listing.description || listing.ai_generated_description || 'No description available.'}
                  </p>
                  
                  {/* Key Features List */}
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span>Well-maintained vehicle with complete service history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span>Single owner, accident-free</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span>All documents up to date</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5" />
                      <span>Genuine mileage with service records</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Specifications Tab */}
              {activeTab === 'specs' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Technical Specifications</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(specifications).map(([label, value]) => (
                      <div key={label} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">{label}</p>
                        <p className="font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features Tab */}
              {activeTab === 'features' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Features & Equipment</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(features).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold mb-3 text-blue-600 capitalize">
                          {category}
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

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Vehicle History</h2>
                  <div className="space-y-4">
                    {vehicleHistory.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{item.type}</p>
                              <p className="text-gray-700 mt-1">{item.description}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(item.date).toLocaleDateString()} • {item.mileage.toLocaleString()} km
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Dealer Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Dealer</h2>
            
            {/* Dealer Profile */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {dealer.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{dealer.name}</p>
                <div className="flex items-center gap-1 text-sm">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(dealer.rating) ? 'fill-current' : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {dealer.rating} ({dealer.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              <MapPin className="inline w-4 h-4 mr-1" />
              {dealer.location}
            </p>

            <p className="text-xs text-gray-500 mb-4">{dealer.responseTime}</p>

            {/* Contact Buttons */}
            <div className="space-y-3">
              {!showContactInfo ? (
                <button
                  onClick={() => setShowContactInfo(true)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Show Contact Info
                </button>
              ) : (
                <>
                  <a
                    href={`tel:${dealer.phone}`}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {dealer.phone}
                  </a>
                  <a
                    href={`https://wa.me/${formatPhoneNumber(dealer.whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                  <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Send Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Finance Calculator */}
          <div className="bg-white rounded-xl shadow-sm p-6" id="finance-calculator">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Finance Calculator
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Vehicle Price</label>
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
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
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
                  value={interestRate}
                  step="0.1"
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
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

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-3">
                <i className="fas fa-heart text-red-500 text-xl"></i>
                <span>Save to Favorites</span>
              </button>
              <button className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-3">
                <i className="fas fa-chart-bar text-blue-500 text-xl"></i>
                <span>Compare Vehicles</span>
              </button>
              <button className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-3">
                <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
                <span>Get Valuation</span>
              </button>
              <button className="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center gap-3">
                <i className="fas fa-car text-blue-600 text-xl"></i>
                <span>Request Test Drive</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Vehicles Section */}
      {similarListings.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Similar Vehicles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarListings.slice(0, 6).map((similar) => (
              <Link
                key={similar.id}
                href={`/listings/${similar.id}`}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all group"
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
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    Rs. {similar.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{similar.year}</span>
                    <span>•</span>
                    <span>{similar.mileage?.toLocaleString() || 'N/A'} km</span>
                    <span>•</span>
                    <span>{similar.fuel_type || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1"><i className="fas fa-map-marker-alt mr-1"></i> {similar.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Information</h3>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Always verify vehicle documents before making a purchase</li>
          <li>• Request a professional inspection if possible</li>
          <li>• Check service history and ownership records</li>
          <li>• Never make advance payments without proper verification</li>
        </ul>
      </div>
    </>
  )
}
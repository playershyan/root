'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Eye, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getFairRotatedListings, getListingExposureStats } from '@/lib/utils/featuredRotation'
import { Listing } from '@/lib/types'

interface FeaturedListingsProps {
  displayCount?: number
  rotationInterval?: number
}

const FeaturedListings = ({ 
  displayCount = 6, 
  rotationInterval = 5 * 60 * 1000 // 5 minutes default
}: FeaturedListingsProps) => {
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([])
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([])
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all featured listings with fair exposure logic
  const fetchFeaturedListings = async () => {
    try {
      setIsLoading(true)
      
      // Get all featured listings that are active and not expired
      const { data: listings, error } = await supabase
        .from('listings')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching featured listings:', error)
        return
      }

      if (listings && listings.length > 0) {
        // Apply fair exposure algorithm using rotation manager
        const rotatedListings = getFairRotatedListings(listings, displayCount)
        setFeaturedListings(listings)
        setDisplayedListings(rotatedListings)
      }
    } catch (error) {
      console.error('Error in fetchFeaturedListings:', error)
    } finally {
      setIsLoading(false)
    }
  }


  // Rotate displayed listings periodically with fair exposure
  const rotateListings = () => {
    if (featuredListings.length <= displayCount) return
    
    // Use rotation manager to get new fair selection
    const rotatedListings = getFairRotatedListings(featuredListings, displayCount)
    setDisplayedListings(rotatedListings)
    setCurrentRotationIndex(prev => prev + 1)
  }

  // Initial fetch
  useEffect(() => {
    fetchFeaturedListings()
  }, [])

  // Set up rotation timer
  useEffect(() => {
    if (featuredListings.length <= displayCount) return

    const interval = setInterval(rotateListings, rotationInterval)
    return () => clearInterval(interval)
  }, [featuredListings, currentRotationIndex, displayCount, rotationInterval])

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`
  }

  const formatMileage = (mileage?: number) => {
    if (!mileage) return ''
    return `${mileage.toLocaleString()} km`
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays} days ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!displayedListings.length) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <h2 className="text-4xl font-bold text-gray-900">Featured Vehicles</h2>
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover premium vehicles with guaranteed visibility. Each listing gets fair exposure through our smart rotation system.
          </p>
          {featuredListings.length > displayCount && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {displayCount} of {featuredListings.length} featured listings • Updates every {Math.floor(rotationInterval / 60000)} minutes
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayedListings.map((listing, index) => (
            <Link 
              key={`${listing.id}-${currentRotationIndex}`} 
              href={`/listings/${listing.id}`}
              className="group block"
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-yellow-300">
                {/* Featured Badge */}
                <div className="absolute z-10 top-4 left-4">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    FEATURED
                  </div>
                </div>

                {/* Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                    <img
                      src={listing.image_url || listing.image_urls?.[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image available</span>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                      {listing.title}
                    </h3>
                    
                    {/* Vehicle details */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      {listing.year && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {listing.year}
                        </span>
                      )}
                      {listing.mileage && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {formatMileage(listing.mileage)}
                        </span>
                      )}
                      {listing.fuel_type && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {listing.fuel_type}
                        </span>
                      )}
                    </div>

                    {/* Location */}
                    {listing.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>{listing.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Price and stats */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {formatPrice(listing.price)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {getTimeAgo(listing.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* View button */}
                    <div className="bg-blue-600 text-white p-2 rounded-full group-hover:bg-blue-700 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all featured listings button */}
        <div className="text-center">
          <Link 
            href="/listings?featured=true"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            View All Featured Vehicles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default FeaturedListings
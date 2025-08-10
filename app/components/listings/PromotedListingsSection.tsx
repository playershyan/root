'use client'

import { usePromotedListings } from '@/lib/hooks/usePromotedListings'
import FeaturedAdCard from './FeaturedAdCard'
import ListingCard from './ListingCard'
import PromotionBadges from './PromotionBadges'

interface PromotedListingsSectionProps {
  filters?: {
    vehicleType?: string
    make?: string
    model?: string
    minPrice?: number
    maxPrice?: number
    location?: string
  }
  limit?: number
  offset?: number
}

export default function PromotedListingsSection({ 
  filters = {}, 
  limit = 20, 
  offset = 0 
}: PromotedListingsSectionProps) {
  
  const {
    featuredListings,
    topSpotListings,
    boostedListings,
    regularListings,
    loading,
    error,
    refetch
  } = usePromotedListings({ ...filters, limit, offset })

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeletons */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error loading listings</p>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Featured Listings Section - Top 2 exclusive spots */}
      {featuredListings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <i className="fas fa-star"></i>
              <span>FEATURED LISTINGS</span>
            </div>
            <span className="text-sm text-gray-500">Premium placement • Maximum visibility</span>
          </div>
          
          <div className="grid gap-6">
            {featuredListings.map((listing) => (
              <FeaturedAdCard 
                key={listing.id} 
                listing={listing} 
                priority="featured"
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Spot Listings Section */}
      {topSpotListings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <i className="fas fa-crown"></i>
              <span>TOP SPOT</span>
            </div>
            <span className="text-sm text-gray-500">Premium positioning</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {topSpotListings.map((listing) => (
              <FeaturedAdCard 
                key={listing.id} 
                listing={listing} 
                priority="top_spot"
              />
            ))}
          </div>
        </div>
      )}

      {/* Separator between premium and regular listings */}
      {(featuredListings.length > 0 || topSpotListings.length > 0) && (
        <div className="border-t-2 border-gray-200 pt-4"></div>
      )}

      {/* Boosted Listings - Daily repositioned to top */}
      {boostedListings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-blue-600">
              <i className="fas fa-arrow-up mr-1"></i>
              Recently Boosted
            </span>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boostedListings.map((listing) => (
              <div key={listing.id} className="relative">
                {/* Boosted indicator */}
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    BOOSTED
                  </div>
                </div>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Listings */}
      {regularListings.length > 0 && (
        <div className="space-y-4">
          {(boostedListings.length > 0) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-600">All Listings</span>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* No listings message */}
      {featuredListings.length === 0 && 
       topSpotListings.length === 0 && 
       boostedListings.length === 0 && 
       regularListings.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-car text-gray-300 text-5xl mb-4"></i>
          <p className="text-gray-500 text-lg">No listings found</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}

// Component for displaying promotion rules
export function PromotionRulesInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <i className="fas fa-info-circle"></i>
        How Promoted Listings Work
      </h3>
      <div className="text-sm text-blue-800 space-y-1">
        <p>• <strong>Featured:</strong> Exclusive top 2 spots with premium format and homepage visibility</p>
        <p>• <strong>Top Spot:</strong> Reserved positions at the beginning of listings with enhanced visibility</p>
        <p>• <strong>Boosted:</strong> Daily repositioning to the top of regular listings</p>
        <p>• <strong>Urgent:</strong> Red urgent marker to communicate immediate sale intent</p>
      </div>
    </div>
  )
}
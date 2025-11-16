import Link from 'next/link'
import Image from 'next/image'
import { Star, Eye, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'

interface Listing {
  id: string
  title: string
  price: number
  image_url?: string
  image_urls?: string[]
  year?: number
  mileage?: number
  fuel_type?: string
  location?: string
  views?: number
  created_at: string
  featured_until?: string
  boost_score?: number
  make?: string
  model?: string
}

interface FeaturedListingsSSRProps {
  displayCount?: number
}

// Server-side function to get fair-rotated listings using database rotation function
const getFeaturedListings = unstable_cache(
  async (displayCount: number = 6): Promise<Listing[]> => {
    try {
      const supabase = createServiceSupabaseClient()

      // Use optimized rotation function with impression tracking
      const { data, error } = await supabase.rpc('get_rotated_featured_ads', {
        p_vehicle_type: null,
        p_limit: displayCount
      })

      if (error) {
        logger.error('Error fetching featured listings', error, {
          component: 'FeaturedListingsSSR',
          action: 'getFeaturedListings'
        })
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      // Map database response to Listing interface
      return data.map((item: any) => ({
        id: item.listing_id,
        title: item.title,
        price: item.price,
        image_url: item.primary_image_url,
        image_urls: item.image_urls,
        year: item.year,
        mileage: item.mileage,
        fuel_type: item.fuel_type,
        location: item.location,
        views: 0, // Not returned by rotation function
        created_at: item.created_at,
        featured_until: null,
        boost_score: item.boost_score,
        make: item.make,
        model: item.model
      }))
    } catch (error) {
      logger.error('Error in getFeaturedListings', error as Error, {
        component: 'FeaturedListingsSSR',
        action: 'getFeaturedListings'
      })
      return []
    }
  },
  ['featured-listings'],
  {
    revalidate: 30, // Cache for 30 seconds (reduced from 60 for better rotation)
    tags: ['featured-listings']
  }
)

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
  
  if (diffInHours < 1) return 'Now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `${diffInDays} days ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

export default async function FeaturedListingsSSR({ displayCount = 6 }: FeaturedListingsSSRProps) {
  const featuredListings = await getFeaturedListings(displayCount)

  if (!featuredListings.length) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Listings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing, index) => (
            <Link 
              key={listing.id} 
              href={`/listings/${listing.id}`}
              className="group block"
            >
              <div className="relative bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 border-2 border-blue-200 hover:border-blue-400">
                {/* Featured Badge */}
                <div className="absolute z-10 top-3 left-3 md:top-4 md:left-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    FEATURED
                  </div>
                </div>

                {/* Image */}
                <div className="relative h-48 md:h-52 bg-gray-200 overflow-hidden">
                  {listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                    <Image
                      src={listing.image_url || listing.image_urls?.[0]}
                      alt={listing.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
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

      </div>
    </section>
  )
}
import { unstable_cache } from 'next/cache'
import { createServiceSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/lib/utils/logger'
import FeaturedCarousel from './FeaturedCarousel'

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
          <p className="text-gray-600">Swipe to explore more premium vehicles</p>
        </div>

        <FeaturedCarousel listings={featuredListings} />
      </div>
    </section>
  )
}
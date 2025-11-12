import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ListingDetailClient from './ListingDetailClient'
import { logger } from '@/lib/utils/logger'

export const revalidate = 60

const LISTING_SELECT_FIELDS = `
  id,
  title,
  make,
  model,
  year,
  price,
  description,
  ai_generated_description,
  location,
  user_id,
  image_url,
  image_urls,
  primary_image_url,
  mileage,
  fuel_type,
  transmission,
  body_type,
  engine_capacity,
  color,
  condition,
  negotiable,
  pricing_type,
  finance_type,
  outstanding_balance,
  monthly_payment,
  is_featured,
  is_top_spot,
  is_boosted,
  is_urgent,
  is_sold,
  is_paused,
  status,
  phone,
  whatsapp,
  email,
  created_at
`

const getCachedListing = cache(async (id: string) => {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT_FIELDS)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to fetch listing for detail page', new Error(error.message), {
      component: 'ListingDetailPage',
      listingId: id,
    })
  }

  return data
})

const getSimilarListingsCached = unstable_cache(
  async (listingId: string, make: string, model: string, year: number, price: number) => {
    const { data, error } = await supabase.rpc('get_similar_listings', {
      p_listing_id: listingId,
      p_make: make,
      p_model: model,
      p_year: year,
      p_price: price,
      p_limit: 6,
    })

    if (error) {
      logger.warn('Failed to fetch similar listings via RPC', new Error(error.message), {
        component: 'ListingDetailPage',
        listingId,
        error: error.message,
      })
      return []
    }

    return data ?? []
  },
  ['similar-listings'],
  { revalidate: 300, tags: ['similar-listings'] }
)

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const listing = await getCachedListing(params.id)

  if (!listing) {
    return {
      title: 'Listing Not Found',
    }
  }

  const formattedPrice = typeof listing.price === 'number'
    ? listing.price.toLocaleString()
    : 'N/A'

  return {
    title: `${listing.title} - Rs. ${formattedPrice} | VERA`,
    description: listing.description || listing.ai_generated_description || `${listing.make} ${listing.model} ${listing.year} for sale in ${listing.location}`,
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await getCachedListing(params.id)

  if (!listing) {
    notFound()
  }

  const currentListingPrice = (() => {
    if (listing.pricing_type === 'finance' && listing.finance_type === 'transfer') {
      return (listing.price || 0) + (listing.outstanding_balance || 0)
    }
    return listing.price || 0
  })()

  const [
    authResponse,
    sellerProfileResponse,
    similarListings,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select(`
        *,
        business_profiles (*)
      `)
      .eq('id', listing.user_id)
      .single(),
    getSimilarListingsCached(
      params.id,
      listing.make,
      listing.model,
      listing.year,
      currentListingPrice
    ),
  ])

  const {
    data: { user },
  } = authResponse

  const sellerProfile = sellerProfileResponse.data

  logger.debug('Seller profile data loaded', {
    component: 'ListingDetailPage',
    hasBusinessProfile: !!sellerProfile?.business_profiles,
    sellerId: listing.user_id
  })

  // Log finance fields for debugging
  logger.debug('Listing finance data', {
    component: 'ListingDetailPage',
    listingId: listing.id,
    pricingType: listing.pricing_type,
    financeType: listing.finance_type,
    hasOutstandingBalance: !!listing.outstanding_balance,
    hasMonthlyPayment: !!listing.monthly_payment
  })

// TEMPORARY TEST - Remove this later
/*if (listing.title.toLowerCase().includes('toyota')) {
  listing.seller_type = 'private'
  listing.seller_name = 'John Smith'
} else {
  listing.seller_type = 'dealer'
  listing.seller_name = 'Premium Motors'
}*/

  // Increment view count (server-side with rate limiting)
  if (user?.id !== listing.user_id) {
    // Fire-and-forget - don't block page render
    (async () => {
      try {
        await supabase.rpc('increment_listing_views_enhanced', {
          listing_id: params.id,
          viewer_ip: null,
          viewer_user_id: user?.id || null,
        })
      } catch {
        // Fallback to simple increment
        try {
          await supabase.rpc('increment_listing_views_simple', {
            listing_id: params.id,
          })
        } catch {
          // Swallow errors - view tracking shouldn't break page load
        }
      }
    })()
  }

  // Prepare image array
  const images = listing.image_urls || (listing.image_url ? [listing.image_url] : [])

  // Debug logging
  logger.debug('Listing images prepared', {
    component: 'ListingDetailPage',
    listingId: listing.id,
    hasImageUrls: !!listing.image_urls,
    hasImageUrl: !!listing.image_url,
    imageCount: images?.length || 0
  })

  // Prepare seller data based on profile type
  let sellerData = null
  if (sellerProfile) {
    // Check if user has an active business profile
    if (sellerProfile.business_profiles && sellerProfile.business_profiles.is_active) {
      const businessProfile = sellerProfile.business_profiles
      sellerData = {
        type: 'business',
        businessId: businessProfile.id,
        name: businessProfile.business_name,
        description: businessProfile.description,
        businessType: businessProfile.business_type,
        website: businessProfile.website,
        address: businessProfile.address,
        businessPhone: businessProfile.phone,
        operatingHours: businessProfile.operating_hours,
        isVerified: businessProfile.is_verified,
        logoUrl: businessProfile.logo_url,
        bannerUrl: businessProfile.banner_url,
        profileImageUrl: businessProfile.profile_image_url,
        // Use business contact info when business profile is active
        location: businessProfile.address || listing.location,
        phone: businessProfile.phone || listing.phone,
        whatsapp: businessProfile.whatsapp || businessProfile.phone || listing.whatsapp || listing.phone,
        email: listing.email,
        avatar: sellerProfile.avatar_url,
        rating: 4.5, // TODO: Implement actual rating system
        reviewCount: 127 // TODO: Implement actual review system
      }
    } else {
      // Use individual profile data when no active business profile
      sellerData = {
        type: 'individual',
        name: sellerProfile.name || 'Private Seller',
        location: sellerProfile.location || listing.location,
        phone: sellerProfile.phone || listing.phone,
        whatsapp: sellerProfile.whatsapp || sellerProfile.phone || listing.whatsapp || listing.phone,
        email: sellerProfile.email || listing.email,
        avatar: sellerProfile.avatar_url,
        bio: sellerProfile.bio
      }
    }
  }

  // Legacy dealer object for backward compatibility with ContactProfile component
  const dealer = sellerData?.type === 'business' ? {
    name: sellerData.name,
    rating: sellerData.rating,
    reviewCount: sellerData.reviewCount,
    location: sellerData.location,
    phone: sellerData.phone,
    whatsapp: sellerData.whatsapp,
    avatar: sellerData.avatar
  } : null

  // Update listing with seller information from profile
  if (sellerData) {
    listing.seller_type = sellerData.type === 'business' ? 'dealer' : 'private'
    listing.seller_name = sellerData.name
  }

  // Import feature categories for proper grouping
  const SAFETY_FEATURES = [
    'Multiple Airbags', 'ABS Brakes', 'Stability Control', 
    'Traction Control', 'Lane Departure Warning', 'Blind Spot Detection',
    'Rear Cross Traffic Alert', 'Emergency Braking'
  ]
  
  const TECH_FEATURES = [
    'Touch Display', 'Bluetooth', 'USB Ports', 'Backup Camera',
    'Parking Sensors', 'Wireless Charging', 'Premium Audio',
    'Apple CarPlay', 'Android Auto', 'Navigation System'
  ]
  
  const COMFORT_FEATURES = [
    'Climate Control', 'Power Windows', 'Power Mirrors', 
    'Keyless Entry', 'Push Start', 'Cruise Control',
    'Leather Seats', 'Sunroof', 'Power Seats'
  ]

  // Prepare features list from database
  const listingFeatures = listing.features || []
  const features = {
    safety: listingFeatures.filter(f => SAFETY_FEATURES.includes(f)),
    technology: listingFeatures.filter(f => TECH_FEATURES.includes(f)),
    comfort: listingFeatures.filter(f => COMFORT_FEATURES.includes(f)),
    performance: listingFeatures.filter(f => ['turbo', 'sport_mode', 'eco_mode', 'all_wheel_drive'].includes(f)),
    // Any features not in the above categories go to "other"
    other: listingFeatures.filter(f =>
      !SAFETY_FEATURES.includes(f) &&
      !TECH_FEATURES.includes(f) &&
      !COMFORT_FEATURES.includes(f) &&
      !['turbo', 'sport_mode', 'eco_mode', 'all_wheel_drive'].includes(f)
    )
  }

  // Prepare specifications - only show fields that have values
  const specifications: Record<string, string | number> = {
    'Make': listing.make,
    'Model': listing.model,
    'Year': listing.year,
  }

  // Add optional fields only if they have values
  if (listing.mileage) specifications['Mileage'] = `${listing.mileage.toLocaleString()} km`
  if (listing.fuel_type) specifications['Fuel Type'] = listing.fuel_type
  if (listing.transmission) specifications['Transmission'] = listing.transmission
  if (listing.engine_capacity) specifications['Engine Capacity'] = `${listing.engine_capacity}cc`
  if (listing.color) specifications['Color'] = listing.color
  if (listing.condition) specifications['Condition'] = listing.condition


  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/listings" className="text-gray-600 hover:text-blue-600">
                Listings
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{listing.title}</li>
          </ol>
        </nav>

        {/* Pass all data to client component */}
        <ListingDetailClient 
          listing={listing}
          images={images}
          dealer={dealer}
          sellerData={sellerData}
          features={features}
          specifications={specifications}
          similarListings={similarListings || []}
        />
      </div>
    </div>
  )
}
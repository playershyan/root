import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ListingDetailClient from './ListingDetailClient'

export const revalidate = 60

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!listing) {
    return {
      title: 'Listing Not Found',
    }
  }

  return {
    title: `${listing.title} - Rs. ${listing.price.toLocaleString()} | VERA`,
    description: listing.description || listing.ai_generated_description || `${listing.make} ${listing.model} ${listing.year} for sale in ${listing.location}`,
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Fetch main listing
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!listing) {
    notFound()
  }

  // Fetch seller's profile information
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select(`
      *,
      business_profiles (*)
    `)
    .eq('id', listing.user_id)
    .single()

  console.log('Seller profile data:', sellerProfile)
  console.log('Business profile exists:', sellerProfile?.business_profiles)

  // Log finance fields for debugging
  console.log('Listing finance data:', {
    id: listing.id,
    pricing_type: listing.pricing_type,
    finance_type: listing.finance_type,
    outstanding_balance: listing.outstanding_balance,
    monthly_payment: listing.monthly_payment
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
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user?.id !== listing.user_id) {
    try {
      // Use the enhanced function with rate limiting
      await supabase.rpc('increment_listing_views_enhanced', { 
        listing_id: params.id,
        viewer_ip: null, // IP tracking handled by API route if needed
        viewer_user_id: user?.id || null
      })
    } catch (error) {
      // Fallback to simple increment if enhanced function fails
      console.warn('Enhanced view tracking failed, using fallback:', error)
      await supabase.rpc('increment_listing_views_simple', { 
        listing_id: params.id 
      })
    }
  }

  // Calculate effective price for comparison (includes outstanding balance for finance transfers)
  const getEffectivePrice = (listing: any) => {
    if (listing.pricing_type === 'finance' && listing.finance_type === 'transfer') {
      return (listing.price || 0) + (listing.outstanding_balance || 0)
    }
    return listing.price || 0
  }

  const currentListingPrice = getEffectivePrice(listing)
  const priceRangeMin = currentListingPrice * 0.9 // -10%
  const priceRangeMax = currentListingPrice * 1.1 // +10%
  const yearRangeMin = (listing.year || 0) - 3
  const yearRangeMax = (listing.year || 0) + 3

  // Fetch all potential similar vehicles
  const { data: potentialSimilar } = await supabase
    .from('listings')
    .select('*')
    .neq('id', params.id)
    .eq('make', listing.make)
    .eq('model', listing.model)
    .gte('year', yearRangeMin)
    .lte('year', yearRangeMax)
    .eq('is_sold', false)
    .eq('is_paused', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Filter by price range and exclude finance transfers without outstanding balance
  const similarListingsFromDB = potentialSimilar?.filter(item => {
    // Exclude finance transfer vehicles that don't have outstanding balance specified
    if (item.pricing_type === 'finance' && item.finance_type === 'transfer' && !item.outstanding_balance) {
      return false
    }

    const itemPrice = getEffectivePrice(item)
    return itemPrice >= priceRangeMin && itemPrice <= priceRangeMax
  }).slice(0, 6) || []

  // MOCK DATA FOR TESTING - Show mock data for specific listing IDs
  const mockSimilarListings = [
    {
      id: 'mock-1',
      title: 'Toyota Prius 2020 Hybrid',
      price: 8500000,
      location: 'Colombo',
      make: 'Toyota',
      model: 'Prius',
      year: 2020,
      mileage: 25000,
      fuel_type: 'Hybrid',
      transmission: 'Automatic',
      image_url: 'https://images.unsplash.com/photo-1637788984288-06dbac739dc0?w=800',
      pricing_type: 'cash' as const,
      is_sold: false,
      is_paused: false,
      status: 'active'
    },
    {
      id: 'mock-2',
      title: 'Honda Vezel 2019 - Finance Transfer',
      price: 5500000,
      outstanding_balance: 3200000,
      location: 'Kandy',
      make: 'Honda',
      model: 'Vezel',
      year: 2019,
      mileage: 45000,
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      image_url: 'https://images.unsplash.com/photo-1606611013016-969c19c27723?w=800',
      pricing_type: 'finance' as const,
      finance_type: 'transfer',
      is_sold: false,
      is_paused: false,
      status: 'active'
    },
    {
      id: 'mock-3',
      title: 'Nissan X-Trail 2021',
      price: 12000000,
      location: 'Gampaha',
      make: 'Nissan',
      model: 'X-Trail',
      year: 2021,
      mileage: 18000,
      fuel_type: 'Hybrid',
      transmission: 'CVT',
      image_urls: ['https://images.unsplash.com/photo-1606664515524-ed9f786329ac?w=800'],
      pricing_type: 'cash' as const,
      is_sold: false,
      is_paused: false,
      status: 'active'
    },
    {
      id: 'mock-4',
      title: 'Mazda CX-5 2020 - Lease Transfer',
      price: 4500000,
      outstanding_balance: 5800000,
      location: 'Matara',
      make: 'Mazda',
      model: 'CX-5',
      year: 2020,
      mileage: 32000,
      fuel_type: 'Petrol',
      transmission: 'Automatic',
      pricing_type: 'finance' as const,
      finance_type: 'transfer',
      is_sold: false,
      is_paused: false,
      status: 'active'
    },
    {
      id: 'mock-5',
      title: 'Suzuki Swift 2022',
      price: 6200000,
      location: 'Negombo',
      make: 'Suzuki',
      model: 'Swift',
      year: 2022,
      mileage: 8000,
      fuel_type: 'Petrol',
      transmission: 'Manual',
      image_url: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800',
      pricing_type: 'cash' as const,
      is_sold: false,
      is_paused: false,
      status: 'active'
    },
    {
      id: 'mock-6',
      title: 'BMW 520d 2018 Luxury Line',
      price: 15000000,
      location: 'Colombo 7',
      make: 'BMW',
      model: '520d',
      year: 2018,
      mileage: 52000,
      fuel_type: 'Diesel',
      transmission: 'Automatic',
      pricing_type: 'cash' as const,
      is_sold: false,
      is_paused: false,
      status: 'active'
    }
  ]

  // Use mock data for testing when visiting any listing
  // Remove this line in production
  const similarListings = params.id ? mockSimilarListings : similarListingsFromDB

  // Prepare image array
  const images = listing.image_urls || (listing.image_url ? [listing.image_url] : [])
  
  // Debug logging
  console.log('Listing detail page - Image data:', {
    listing_id: listing.id,
    image_urls: listing.image_urls,
    image_url: listing.image_url,
    images_array: images,
    images_length: images?.length || 0
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
    'Mileage': listing.mileage ? `${listing.mileage.toLocaleString()} km` : 'N/A',
    'Fuel Type': listing.fuel_type || 'N/A',
    'Transmission': listing.transmission || 'N/A',
  }
  
  // Add optional fields if they exist
  if (listing.engine_capacity) specifications['Engine Capacity'] = `${listing.engine_capacity}cc`
  if (listing.color) specifications['Color'] = listing.color
  if (listing.condition) specifications['Condition'] = listing.condition


  return (
    <div className="min-h-screen bg-gray-50">
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
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
    title: `${listing.title} - Rs. ${listing.price.toLocaleString()} | AutoTrader.lk`,
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
  console.log('Account type:', sellerProfile?.account_type)

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

  // Increment view count
  await supabase
    .from('listings')
    .update({ views: (listing.views || 0) + 1 })
    .eq('id', params.id)

  // Fetch similar vehicles
  const { data: similarListings } = await supabase
    .from('listings')
    .select('*')
    .neq('id', params.id)
    .eq('make', listing.make)
    .eq('is_sold', false)
    .limit(6)
    .order('created_at', { ascending: false })

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
    if (sellerProfile.account_type === 'business' && sellerProfile.business_profiles) {
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
        // Use listing contact info as primary contact
        location: listing.location,
        phone: listing.phone,
        whatsapp: listing.whatsapp || listing.phone,
        email: listing.email,
        avatar: sellerProfile.avatar_url,
        rating: 4.5, // TODO: Implement actual rating system
        reviewCount: 127 // TODO: Implement actual review system
      }
    } else {
      sellerData = {
        type: 'individual',
        name: sellerProfile.name || 'Private Seller',
        location: listing.location,
        phone: listing.phone,
        whatsapp: listing.whatsapp || listing.phone,
        email: listing.email,
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
    // Any features not in the above categories go to "other"
    other: listingFeatures.filter(f => 
      !SAFETY_FEATURES.includes(f) && 
      !TECH_FEATURES.includes(f) && 
      !COMFORT_FEATURES.includes(f)
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
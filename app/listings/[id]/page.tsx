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

  // Mock dealer data (in production, this would come from a dealers table)
  // The dealer object is only used if listing.seller_type is 'dealer' or undefined (backward compatibility)
  const dealer = {
    name: "Premium Auto Dealers",
    rating: 4.5,
    reviewCount: 127,
    location: listing.location,
    phone: listing.phone,
    whatsapp: listing.whatsapp || listing.phone,
    avatar: null
  }

  // For demonstration: if listing doesn't have seller_type, assume it's a dealer (backward compatibility)
  // In production, you would set listing.seller_type and listing.seller_name based on your database
  // Example logic:
  // if (!listing.seller_type) {
  //   listing.seller_type = 'dealer' // or 'private' based on your business logic
  // }
  // if (!listing.seller_name) {
  //   listing.seller_name = listing.seller_type === 'dealer' ? dealer.name : 'John Doe'
  // }

  // Prepare features list (mock data - in production, this would be in the database)
  const features = {
    safety: [
      'Dual Airbags',
      'ABS',
      'Electronic Stability Control',
      'Hill Start Assist',
      'Reverse Camera',
      'Parking Sensors'
    ],
    technology: [
      '7" Touch Display',
      'Bluetooth Connectivity',
      'USB Ports',
      'Apple CarPlay',
      'Android Auto',
      'Wireless Charging'
    ],
    comfort: [
      'Automatic Climate Control',
      'Power Windows',
      'Power Mirrors',
      'Keyless Entry',
      'Push Start',
      'Cruise Control'
    ],
    performance: [
      'Hybrid Engine',
      'CVT Transmission',
      'Eco Mode',
      'Sport Mode',
      'Regenerative Braking'
    ]
  }

  // Prepare specifications
  const specifications = {
    'Make': listing.make,
    'Model': listing.model,
    'Year': listing.year,
    'Mileage': listing.mileage ? `${listing.mileage.toLocaleString()} km` : 'N/A',
    'Fuel Type': listing.fuel_type || 'N/A',
    'Transmission': listing.transmission || 'N/A',
    'Engine Capacity': '1800cc', // Mock data
    'Body Type': 'Sedan', // Mock data
    'Color': 'Pearl White', // Mock data
    'Seating Capacity': '5 Seats', // Mock data
    'Drive Type': 'Front Wheel Drive', // Mock data
    'Number of Owners': '1st Owner', // Mock data
  }


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
          features={features}
          specifications={specifications}
          similarListings={similarListings || []}
        />
      </div>
    </div>
  )
}
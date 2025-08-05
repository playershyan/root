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
  const dealer = {
    name: "Premium Auto Dealers",
    rating: 4.5,
    reviewCount: 127,
    location: listing.location,
    phone: listing.phone,
    whatsapp: listing.whatsapp || listing.phone,
    avatar: null,
    responseTime: "Usually responds within 2 hours"
  }

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

  // Vehicle history (mock data)
  const vehicleHistory = [
    {
      date: '2024-06-15',
      type: 'Service',
      description: 'Regular service at authorized dealer',
      mileage: 45000
    },
    {
      date: '2024-01-10',
      type: 'Service',
      description: 'Oil change and filter replacement',
      mileage: 40000
    },
    {
      date: '2023-07-20',
      type: 'Insurance',
      description: 'Full insurance renewal',
      mileage: 35000
    }
  ]

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
          vehicleHistory={vehicleHistory}
          similarListings={similarListings || []}
        />
      </div>
    </div>
  )
}
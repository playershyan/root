import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

// This will be replaced with actual dealer data fetching later
interface DealerProfile {
  id: string
  name: string
  slug: string
  rating: number
  reviewCount: number
  location: string
  phone: string
  whatsapp: string
  email?: string
  description?: string
  avatar?: string
  establishedYear?: number
  specializations?: string[]
  certifications?: string[]
  operatingHours?: {
    weekdays: string
    weekends: string
  }
  socialMedia?: {
    facebook?: string
    instagram?: string
    website?: string
  }
  stats?: {
    totalListings: number
    activeSince: string
    responseTime: string
  }
}

// Mock dealer data - this will be replaced with database fetching
const getDealerData = async (dealerName: string): Promise<DealerProfile | null> => {
  // Simulate database lookup
  const mockDealers: Record<string, DealerProfile> = {
    'premium-auto-dealers': {
      id: '1',
      name: 'Premium Auto Dealers',
      slug: 'premium-auto-dealers',
      rating: 4.5,
      reviewCount: 127,
      location: 'Colombo 07, Western Province',
      phone: '0112345678',
      whatsapp: '0771234567',
      email: 'info@premiumauto.lk',
      description: 'Leading auto dealer in Colombo with over 15 years of experience in quality vehicles.',
      establishedYear: 2008,
      specializations: ['Luxury Cars', 'Japanese Vehicles', 'Hybrid Vehicles'],
      certifications: ['Authorized Toyota Dealer', 'Honda Premium Partner'],
      operatingHours: {
        weekdays: '9:00 AM - 6:00 PM',
        weekends: '9:00 AM - 4:00 PM'
      },
      socialMedia: {
        facebook: 'https://facebook.com/premiumauto',
        website: 'https://premiumauto.lk'
      },
      stats: {
        totalListings: 45,
        activeSince: 'March 2008',
        responseTime: 'Within 2 hours'
      }
    }
  }
  
  return mockDealers[dealerName] || null
}

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: { dealerName: string } 
}): Promise<Metadata> {
  const dealer = await getDealerData(params.dealerName)
  
  if (!dealer) {
    return {
      title: 'Dealer Not Found | AutoTrader.lk',
    }
  }

  return {
    title: `${dealer.name} - Dealer Profile | AutoTrader.lk`,
    description: dealer.description || `View ${dealer.name}'s profile, ratings, and current vehicle listings on AutoTrader.lk`,
  }
}

export default async function DealerProfilePage({
  params,
}: {
  params: { dealerName: string }
}) {
  const dealer = await getDealerData(params.dealerName)

  if (!dealer) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <Link href="/dealers" className="text-gray-600 hover:text-blue-600">
                Dealers
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">{dealer.name}</li>
          </ol>
        </nav>

        {/* Placeholder Content - This will be populated later */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              {dealer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{dealer.name}</h1>
            <p className="text-gray-600 mb-6">{dealer.location}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">🚧 Page Under Construction</h2>
              <p className="text-blue-800 text-sm mb-4">
                This dealer profile page is being built. Soon you'll be able to view:
              </p>
              <ul className="text-left text-blue-700 text-sm space-y-1">
                <li>• Complete dealer information</li>
                <li>• Customer reviews and ratings</li>
                <li>• Current vehicle listings</li>
                <li>• Contact details and hours</li>
                <li>• Dealer specializations</li>
              </ul>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <Link 
                href="/listings" 
                className="btn-primary px-6 py-2 rounded-lg"
              >
                View All Listings
              </Link>
              <Link 
                href="/dealers" 
                className="btn-secondary px-6 py-2 rounded-lg"
              >
                Browse Dealers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
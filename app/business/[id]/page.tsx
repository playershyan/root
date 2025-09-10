import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Building2, MapPin, Phone, Globe, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import ListingCard from '@/app/components/listings/ListingCard'

export const revalidate = 60

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_name, description')
    .eq('id', params.id)
    .single()

  if (!business) {
    return {
      title: 'Business Not Found',
    }
  }

  return {
    title: `${business.business_name} | VERA`,
    description: business.description,
  }
}

export default async function BusinessPage({
  params,
}: {
  params: { id: string }
}) {
  // Fetch business profile
  const { data: businessProfile } = await supabase
    .from('business_profiles')
    .select(`
      *,
      profiles (
        id,
        name,
        email,
        phone
      )
    `)
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!businessProfile) {
    notFound()
  }

  // Fetch all active listings from this business
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', businessProfile.user_id)
    .eq('is_sold', false)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="relative h-48 lg:h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        {businessProfile.banner_url && (
          <img 
            src={businessProfile.banner_url} 
            alt={`${businessProfile.business_name} banner`}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link 
            href="/listings" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-lg text-gray-700 hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Listings
          </Link>
        </div>
      </div>

      {/* Business Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl border-4 border-white shadow-md overflow-hidden bg-gray-100">
                  {businessProfile.profile_image_url || businessProfile.logo_url ? (
                    <img 
                      src={businessProfile.profile_image_url || businessProfile.logo_url} 
                      alt={businessProfile.business_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                      <Building2 className="w-12 h-12 lg:w-16 lg:h-16 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Business Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
                      {businessProfile.business_name}
                      {businessProfile.is_verified && (
                        <CheckCircle className="w-7 h-7 text-blue-600" aria-label="Verified Business" />
                      )}
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      {businessProfile.description}
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {businessProfile.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-gray-900">{businessProfile.address}</p>
                      </div>
                    </div>
                  )}
                  
                  {businessProfile.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{businessProfile.phone}</p>
                      </div>
                    </div>
                  )}

                  {businessProfile.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a 
                          href={businessProfile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {businessProfile.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {businessProfile.operating_hours && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Operating Hours</p>
                        <p className="text-gray-900">{businessProfile.operating_hours}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Vehicles ({listings?.length || 0})
            </h2>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No vehicles available at the moment</p>
              <p className="text-gray-400 mt-2">Check back later for new listings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
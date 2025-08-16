import Link from 'next/link'
import { notFound } from 'next/navigation'
import { 
  MapPin, 
  Phone, 
  Globe, 
  MessageSquare, 
  Star,
  Calendar,
  Car,
  Verified,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DealerProfileProps {
  params: {
    id: string
  }
}

export default async function DealerProfilePage({ params }: DealerProfileProps) {
  // Fetch dealer profile data
  const { data: dealer } = await supabase
    .from('profiles')
    .select(`
      *,
      business_profile:business_profiles(*)
    `)
    .eq('id', params.id)
    .eq('account_type', 'business')
    .single()

  if (!dealer || !dealer.business_profile) {
    notFound()
  }

  const businessProfile = dealer.business_profile

  // Fetch dealer's active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', params.id)
    .eq('is_sold', false)
    .order('created_at', { ascending: false })
    .limit(12)

  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '').replace(/^94/, '+94')
  }

  const getWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone.startsWith('94') ? cleanPhone : '94' + cleanPhone}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <Link href="/listings" className="text-gray-600 hover:text-blue-600">Listings</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Dealer Profile</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Logo/Avatar */}
                <div className="flex-shrink-0">
                  {businessProfile.logo_url ? (
                    <img
                      src={businessProfile.logo_url}
                      alt={`${businessProfile.business_name} logo`}
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {businessProfile.business_name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{businessProfile.business_name}</h1>
                    {businessProfile.is_verified && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        <Verified className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4">{businessProfile.business_type || 'Auto Dealer'}</p>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Member since {new Date(dealer.created_at).getFullYear()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="w-4 h-4" />
                      {listings?.length || 0} Active Listings
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      4.8 Rating (24 reviews)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            {businessProfile.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {businessProfile.business_name}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {businessProfile.description}
                </p>
              </div>
            )}

            {/* Active Listings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Current Inventory</h2>
                <Link 
                  href={`/listings?dealer=${params.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  View All <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <Link 
                      key={listing.id} 
                      href={`/listings/${listing.id}`}
                      className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="aspect-w-16 aspect-h-12">
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                            <Car className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-lg font-bold text-blue-600">
                          Rs. {listing.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {listing.year} • {listing.mileage?.toLocaleString()} km
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active listings at the moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="space-y-4">
                {/* Address */}
                {businessProfile.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{businessProfile.address}</p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {businessProfile.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(businessProfile.phone)}</p>
                    </div>
                  </div>
                )}

                {/* Website */}
                {businessProfile.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Website</p>
                      <a 
                        href={businessProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}

                {/* Operating Hours */}
                {businessProfile.operating_hours && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Operating Hours</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {businessProfile.operating_hours}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact Actions */}
              <div className="mt-6 space-y-3">
                {businessProfile.phone && (
                  <>
                    {/* Call Button */}
                    <a
                      href={`tel:${formatPhoneNumber(businessProfile.phone)}`}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>

                    {/* WhatsApp Button */}
                    <a
                      href={getWhatsAppLink(businessProfile.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </>
                )}

                {/* Message Button */}
                <button className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send Message
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium text-gray-900">95%</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium text-gray-900">Within 1 hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
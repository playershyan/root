import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, Building2, CheckCircle, Car, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { getBusinessProfile } from './utils/getBusinessProfile'
import { Button } from '@/components/ui/button'

// Enable ISR with 60-second revalidation
export const revalidate = 60

export default async function BusinessPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { profile, hasProfile } = await getBusinessProfile(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        {!hasProfile || !profile ? (
          /* No Business Profile */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center max-w-md mx-auto">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h1 className="text-2xl font-semibold mb-2">Create a Business Profile</h1>
              <p className="text-gray-600 mb-6">
                Showcase your dealership or business to attract more customers and build trust
              </p>
              
              <div className="grid grid-cols-1 gap-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Verified Badge</p>
                    <p className="text-sm text-gray-600">Stand out with a verified business badge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Business Page</p>
                    <p className="text-sm text-gray-600">Get a dedicated page for your business</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">More Visibility</p>
                    <p className="text-sm text-gray-600">Reach more potential customers</p>
                  </div>
                </div>
              </div>

              <Button variant="primary" size="default" disabled>
                Create Business Profile
              </Button>
            </div>
          </div>
        ) : (
          /* Has Business Profile */
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Banner */}
              {profile.banner_url && (
                <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 overflow-hidden">
                  <img
                    src={profile.banner_url}
                    alt="Business Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Profile Info */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt={profile.business_name}
                      className="w-20 h-20 rounded-lg object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-semibold">{profile.business_name}</h1>
                      {profile.is_verified && (
                        <CheckCircle className="w-6 h-6 text-blue-600" title="Verified Business" />
                      )}
                    </div>
                    {profile.business_type && (
                      <p className="text-gray-600">{profile.business_type}</p>
                    )}
                    {profile.city && (
                      <p className="text-sm text-gray-500 mt-1">{profile.city}</p>
                    )}
                  </div>

                  <Button variant="outline" size="sm" disabled>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.total_listings || 0}</p>
                    <p className="text-sm text-gray-600">Total Listings</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.active_listings || 0}</p>
                    <p className="text-sm text-gray-600">Active Listings</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <Star className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profile.rating?.toFixed(1) || '0.0'}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Business Details</h2>
              
              <div className="space-y-3">
                {profile.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">About</p>
                    <p className="text-gray-600 mt-1">{profile.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {profile.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-600">{profile.phone}</p>
                    </div>
                  )}
                  {profile.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-600">{profile.email}</p>
                    </div>
                  )}
                  {profile.website && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                        {profile.website}
                      </a>
                    </div>
                  )}
                  {profile.address && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Address</p>
                      <p className="text-gray-600">{profile.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

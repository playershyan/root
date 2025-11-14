import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Camera } from 'lucide-react'
import Link from 'next/link'
import { getAccountInfo } from './utils/getAccountInfo'
import { Button } from '@/components/ui/button'

// Enable ISR with 60-second revalidation
export const revalidate = 60

export default async function AccountPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { profile, preferences, stats, email } = await getAccountInfo(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Profile Information</h2>
              <Button variant="outline" size="sm" disabled>
                Edit Profile
              </Button>
            </div>
            
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <button
                  disabled
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-gray-900">{profile?.full_name || 'Not set'}</p>
                </div>

                {profile?.display_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Display Name</label>
                    <p className="mt-1 text-gray-900">{profile.display_name}</p>
                  </div>
                )}

                {profile?.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-gray-600">{profile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 py-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{email}</p>
                </div>
              </div>

              {profile?.phone && (
                <div className="flex items-center gap-3 py-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-gray-900">{profile.phone}</p>
                  </div>
                </div>
              )}

              {profile?.whatsapp && (
                <div className="flex items-center gap-3 py-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">WhatsApp</p>
                    <p className="text-gray-900">{profile.whatsapp}</p>
                  </div>
                </div>
              )}

              {profile?.location && (
                <div className="flex items-center gap-3 py-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p className="text-gray-900">{profile.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Account Statistics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.total_listings}</p>
                <p className="text-sm text-gray-600">Listings</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.total_wanted_requests}</p>
                <p className="text-sm text-gray-600">Requests</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.total_favorites}</p>
                <p className="text-sm text-gray-600">Favorites</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{stats.account_age_days}</p>
                <p className="text-sm text-gray-600">Days</p>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <Button variant="outline" size="sm" disabled>
                Save Changes
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_notifications}
                  disabled
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive browser notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_notifications}
                  disabled
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Price Drop Alerts</p>
                  <p className="text-sm text-gray-600">Get notified when prices drop</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.price_drop_alerts}
                  disabled
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">New Matches</p>
                  <p className="text-sm text-gray-600">Alert me about matching listings</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.new_matches_alerts}
                  disabled
                  className="w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Marketing Emails</p>
                  <p className="text-sm text-gray-600">Receive promotional content</p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.marketing_emails}
                  disabled
                  className="w-4 h-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

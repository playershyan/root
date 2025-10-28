'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import { ArrowLeft, MapPin, Calendar, Eye, Edit, Share2, Flag, Zap, TrendingUp } from 'lucide-react'
import ContactModal from '@/app/components/modals/ContactModal'
import WantedRequestFavoriteButton from '@/app/components/WantedRequestFavoriteButton'

interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  location: string
  phone: string
  whatsapp?: string
  email?: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number
  urgency?: 'high' | 'medium' | 'low'
  created_at: string
  user_name?: string
  user_avatar?: string
  status: string
  views?: number
  clicks?: number
  is_high_priority?: boolean
  high_priority_until?: string
}

export default function WantedRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [request, setRequest] = useState<WantedRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRequest()
      incrementViews()
    }
  }, [params.id, user])

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('wanted_requests')
        .select(`
          *,
          profiles (
            id,
            name,
            phone,
            email,
            location,
            avatar_url,
            business_profiles (
              id,
              business_name,
              phone,
              whatsapp,
              address,
              is_active
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Wanted request not found')
        } else {
          throw error
        }
        return
      }

      if (!data || data.status !== 'active') {
        setError('This wanted request is no longer available')
        return
      }

      const profile = data.profiles

      // Check if current user is the owner
      setIsOwner(user?.id === data.user_id)

      // Determine contact info based on business profile status
      let contactInfo = {
        phone: data.phone,
        whatsapp: data.whatsapp,
        email: data.email,
        location: data.location
      }

      if (profile) {
        if (profile.business_profiles && profile.business_profiles.is_active) {
          const businessProfile = profile.business_profiles
          contactInfo = {
            phone: businessProfile.phone || profile.phone || data.phone,
            whatsapp: businessProfile.whatsapp || businessProfile.phone || profile.whatsapp || profile.phone || data.whatsapp,
            email: profile.email || data.email,
            location: businessProfile.address || profile.location || data.location
          }
        } else {
          contactInfo = {
            phone: profile.phone || data.phone,
            whatsapp: profile.whatsapp || profile.phone || data.whatsapp,
            email: profile.email || data.email,
            location: profile.location || data.location
          }
        }
      }

      setRequest({
        ...data,
        phone: contactInfo.phone || data.phone || 'Contact via platform',
        whatsapp: contactInfo.whatsapp || data.whatsapp || contactInfo.phone,
        email: contactInfo.email || data.email || '',
        location: contactInfo.location || data.location || 'Location not specified',
        user_name: profile?.name || data.user_name || `User ${data.id?.slice(0, 4) || 'Unknown'}`,
        user_avatar: (profile?.name || data.user_name || 'U').slice(0, 2).toUpperCase()
      })
    } catch (error) {
      console.error('Error fetching wanted request:', error)
      setError('Failed to load wanted request')
    } finally {
      setLoading(false)
    }
  }

  const incrementViews = async () => {
    try {
      await supabase.rpc('increment_wanted_request_views', {
        request_id: params.id
      })
    } catch (error) {
      // Silently fail if function doesn't exist
      console.debug('Views increment not available:', error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: request?.title,
        text: request?.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleContact = async () => {
    setShowContactModal(true)

    // Increment clicks
    try {
      await supabase.rpc('increment_wanted_request_clicks', {
        request_id: params.id
      })
    } catch (error) {
      console.debug('Clicks increment not available:', error)
    }
  }

  const formatBudget = (value: number | null | undefined): string => {
    if (!value) return '0'

    if (value < 1000000) {
      const rounded = Math.round(value / 50000) * 50000
      const thousands = rounded / 1000
      return `${thousands}K`
    }

    const rounded = Math.round(value / 500000) * 500000
    const millions = rounded / 1000000

    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Posted today'
    if (diffInDays === 1) return 'Posted 1 day ago'
    if (diffInDays < 7) return `Posted ${diffInDays} days ago`
    if (diffInDays < 30) return `Posted ${Math.floor(diffInDays / 7)} weeks ago`
    return `Posted ${Math.floor(diffInDays / 30)} months ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading wanted request...</p>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Request Not Found'}</h1>
            <p className="text-gray-600 mb-6">The wanted request you're looking for doesn't exist or has been removed.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <Link
                href="/wanted"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Browse Wanted Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Determine tier styling
  const isGoldFeatured = request.urgency === 'high'
  const isHighPriority = request.is_high_priority
  const isBoosted = request.is_boosted

  const getTierStyles = () => {
    if (isHighPriority) {
      return {
        containerClass: 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50',
        borderClass: 'border-2 border-red-300',
        accentColor: 'red'
      }
    }
    if (isGoldFeatured) {
      return {
        containerClass: 'bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50',
        borderClass: 'border-2 border-yellow-400',
        accentColor: 'yellow'
      }
    }
    if (isBoosted) {
      return {
        containerClass: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
        borderClass: 'border-2 border-blue-300',
        accentColor: 'blue'
      }
    }
    return {
      containerClass: 'bg-white',
      borderClass: 'border border-gray-200',
      accentColor: 'gray'
    }
  }

  const tierStyles = getTierStyles()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Priority Badge */}
            <div className={`rounded-lg shadow-md p-6 ${tierStyles.containerClass} ${tierStyles.borderClass}`}>
              {/* Tier Badges */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {isHighPriority && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">
                    <Zap className="w-5 h-5 fill-current" />
                    URGENT REQUEST
                  </span>
                )}
                {isGoldFeatured && !isHighPriority && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full text-sm font-bold shadow-md">
                    <i className="fas fa-star"></i>
                    FEATURED
                  </span>
                )}
                {isBoosted && !isHighPriority && !isGoldFeatured && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-md">
                    <TrendingUp className="w-4 h-4" />
                    BOOSTED
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatTimeAgo(request.created_at)}
                </div>
                {request.views !== undefined && request.views > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {request.views} views
                  </div>
                )}
                {request.clicks !== undefined && request.clicks > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {request.clicks} responses
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {request.location}
                </div>
              </div>

              {/* Budget */}
              <div className={`rounded-lg p-4 border-l-4 ${
                isHighPriority ? 'bg-red-100 border-red-600' :
                isGoldFeatured ? 'bg-yellow-100 border-yellow-600' :
                isBoosted ? 'bg-blue-100 border-blue-600' :
                'bg-blue-50 border-blue-600'
              }`}>
                <div className="font-semibold text-gray-700 mb-1">Budget Range</div>
                <div className={`text-2xl font-bold ${
                  isHighPriority ? 'text-red-700' :
                  isGoldFeatured ? 'text-yellow-700' :
                  isBoosted ? 'text-blue-700' :
                  'text-blue-600'
                }`}>
                  Rs. {formatBudget(request.min_budget)} - {formatBudget(request.max_budget)}
                </div>
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div className={`rounded-lg shadow-md p-6 ${
                isHighPriority || isGoldFeatured || isBoosted ? tierStyles.containerClass : 'bg-white'
              } ${
                isHighPriority || isGoldFeatured || isBoosted ? tierStyles.borderClass : ''
              }`}>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
              </div>
            )}

            {/* Vehicle Preferences */}
            <div className={`rounded-lg shadow-md p-6 ${
              isHighPriority || isGoldFeatured || isBoosted ? tierStyles.containerClass : 'bg-white'
            } ${
              isHighPriority || isGoldFeatured || isBoosted ? tierStyles.borderClass : ''
            }`}>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vehicle Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                {request.make && (
                  <div>
                    <div className="text-sm text-gray-600">Make</div>
                    <div className="font-semibold text-gray-900">{request.make}</div>
                  </div>
                )}
                {request.model && (
                  <div>
                    <div className="text-sm text-gray-600">Model</div>
                    <div className="font-semibold text-gray-900">{request.model}</div>
                  </div>
                )}
                {(request.min_year || request.max_year) && (
                  <div>
                    <div className="text-sm text-gray-600">Year Range</div>
                    <div className="font-semibold text-gray-900">
                      {request.min_year || 'Any'} - {request.max_year || 'Any'}
                    </div>
                  </div>
                )}
                {request.fuel_type && (
                  <div>
                    <div className="text-sm text-gray-600">Fuel Type</div>
                    <div className="font-semibold text-gray-900">{request.fuel_type}</div>
                  </div>
                )}
                {request.transmission && (
                  <div>
                    <div className="text-sm text-gray-600">Transmission</div>
                    <div className="font-semibold text-gray-900">{request.transmission}</div>
                  </div>
                )}
                {request.max_mileage && (
                  <div>
                    <div className="text-sm text-gray-600">Max Mileage</div>
                    <div className="font-semibold text-gray-900">{request.max_mileage.toLocaleString()} km</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact/Actions Card */}
            <div className={`rounded-lg shadow-md p-6 sticky top-6 ${
              isHighPriority || isGoldFeatured || isBoosted ? tierStyles.containerClass : 'bg-white'
            } ${
              isHighPriority || isGoldFeatured || isBoosted ? tierStyles.borderClass : ''
            }`}>
              {isOwner ? (
                <>
                  <h3 className="font-semibold text-gray-900 mb-4">Manage Request</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/wanted/edit/${request.id}`}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white hover:opacity-90 transition font-semibold ${
                        isHighPriority ? 'bg-gradient-to-r from-red-600 to-orange-600' :
                        isGoldFeatured ? 'bg-gradient-to-r from-yellow-600 to-amber-600' :
                        isBoosted ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                        'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Request
                    </Link>

                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    <Link
                      href="/profile"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      Back to Profile
                    </Link>
                  </div>

                  {/* Stats for owner */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-gray-900 mb-3">Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Views</span>
                        <span className="font-semibold text-gray-900">{request.views || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Responses</span>
                        <span className="font-semibold text-gray-900">{request.clicks || 0}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                      {request.user_avatar}
                    </div>
                    <h3 className="font-semibold text-gray-900">{request.user_name}</h3>
                  </div>

                  <button
                    onClick={handleContact}
                    className={`w-full text-white py-3 rounded-lg hover:opacity-90 transition font-semibold mb-3 ${
                      isHighPriority ? 'bg-gradient-to-r from-red-600 to-orange-600 animate-pulse' :
                      isGoldFeatured ? 'bg-gradient-to-r from-yellow-600 to-amber-600' :
                      isBoosted ? 'bg-gradient-to-r from-blue-600 to-indigo-600' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Respond to Request
                  </button>

                  <div className="space-y-2">
                    <WantedRequestFavoriteButton
                      requestId={request.id}
                      showText={true}
                      size="large"
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    />

                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>

                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {request && !isOwner && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          listing={{
            id: request.id,
            title: request.title,
            phone: request.phone,
            whatsapp: request.whatsapp,
            price: request.max_budget || request.min_budget || 0,
            location: request.location,
            make: request.make,
            model: request.model,
            year: request.max_year || request.min_year
          }}
        />
      )}
    </div>
  )
}

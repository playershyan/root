'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import { ArrowLeft, MapPin, Calendar, Eye, Edit, Share2, Flag, Zap, TrendingUp } from 'lucide-react'

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

  useEffect(() => {
    if (params.id && user) {
      fetchRequest()
    } else if (!user && !loading) {
      router.push('/auth/signin')
    }
  }, [params.id, user])

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('wanted_requests')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user?.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Wanted request not found or you do not have permission to view it')
        } else {
          throw error
        }
        return
      }

      if (!data) {
        setError('Wanted request not found')
        return
      }

      setRequest(data)
    } catch (error) {
      console.error('Error fetching wanted request:', error)
      setError('Failed to load wanted request')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    const publicUrl = `${window.location.origin}/wanted/public/${params.id}`
    if (navigator.share) {
      navigator.share({
        title: request?.title,
        text: request?.description,
        url: publicUrl
      })
    } else {
      navigator.clipboard.writeText(publicUrl)
      alert('Link copied to clipboard!')
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
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Request Not Found'}</h1>
            <p className="text-gray-600 mb-6">You do not have permission to view this wanted request.</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Go Back
              </button>
              <Link
                href="/profile"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Status Badge */}
              <div className="mb-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  request.status === 'active' ? 'bg-green-100 text-green-700' :
                  request.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  request.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                  request.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {request.status.toUpperCase()}
                </span>
                {request.is_high_priority && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    <Zap className="w-4 h-4 fill-current" />
                    HIGH PRIORITY
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{request.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatTimeAgo(request.created_at)}
                </div>
                {request.views !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {request.views} views
                  </div>
                )}
                {request.clicks !== undefined && (
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
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <div className="font-semibold text-gray-700 mb-1">Budget Range</div>
                <div className="text-2xl font-bold text-blue-600">
                  Rs. {formatBudget(request.min_budget)} - {formatBudget(request.max_budget)}
                </div>
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
              </div>
            )}

            {/* Vehicle Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
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
            {/* Actions Card */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Manage Request</h3>

              <div className="space-y-2">
                <Link
                  href={`/wanted/edit/${request.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
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
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
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
          </div>
        </div>
      </div>

    </div>
  )
}

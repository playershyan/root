'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, MapPin, MoreVertical, Share2, Edit, Pause, Play, RefreshCw, Trash2, X, Zap } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import WantedRequestStatusBadge from '@/app/components/wantedRequests/WantedRequestStatusBadge'
import WantedRequestActions from '@/app/components/wantedRequests/WantedRequestActions'
import WantedRequestStatusMessage from '@/app/components/wantedRequests/WantedRequestStatusMessage'

interface WantedRequest {
  id: string
  title: string
  description: string
  budget: number
  status: 'active' | 'paused' | 'closed' | 'reported'
  postedDate: string
  clicks: number
  location: string
  isReportedTakedown?: boolean
  rejectionReason?: string
}

export default function WantedPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>([])
  const [wantedRequestsLoading, setWantedRequestsLoading] = useState(true)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  // Helper: Format date
  const formatListingDate = (dateString: string): string => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)

    return `${hours}:${minutes} ${day}/${month}/${year}`
  }

  // Helper: Days until renewal
  const getDaysUntilWantedRequestRenewal = (postedDate: string) => {
    const posted = new Date(postedDate)
    const now = new Date()
    const daysSincePosted = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))
    const daysUntilRenewal = 18 - daysSincePosted
    return daysUntilRenewal > 0 ? daysUntilRenewal : 0
  }

  // Load wanted requests
  const loadWantedRequests = useCallback(async () => {
    if (!user) return

    try {
      const { data: wantedRequests, error } = await supabase
        .from('wanted_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching wanted requests:', error)
        setWantedRequests([])
      } else {
        const formattedRequests = wantedRequests?.map(request => ({
          id: request.id,
          title: request.title,
          description: request.description,
          budget: request.budget,
          status: request.status,
          postedDate: new Date(request.created_at).toLocaleDateString(),
          clicks: request.clicks || 0,
          location: request.location,
          isReportedTakedown: request.is_reported || false,
          rejectionReason: request.rejection_reason || undefined
        })) || []

        setWantedRequests(formattedRequests)
      }
    } catch (error) {
      console.error('Error loading wanted requests:', error)
      setWantedRequests([])
    } finally {
      setWantedRequestsLoading(false)
    }
  }, [user])

  // Load on mount
  useEffect(() => {
    if (!loading && user) {
      loadWantedRequests()
    }
  }, [user, loading, loadWantedRequests])

  // Handle pause/resume
  const handlePauseResumeWantedRequest = async (requestId: string, action: 'pause' | 'resume') => {
    try {
      const response = await fetch('/api/wanted-requests/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} wanted request`)
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: action === 'pause' ? 'paused' : 'active' }
            : request
        )
      )

      alert(data.message || `Wanted request ${action}d successfully`)
    } catch (error: any) {
      console.error(`Error ${action}ing wanted request:`, error)
      alert(error.message || `Failed to ${action} wanted request`)
    }
  }

  // Handle close
  const handleCloseWantedRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to close this wanted request? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/wanted-requests/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close wanted request')
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'closed' }
            : request
        )
      )

      alert(data.message || 'Wanted request closed successfully')
    } catch (error: any) {
      console.error('Error closing wanted request:', error)
      alert(error.message || 'Failed to close wanted request')
    }
  }

  // Handle renew
  const handleRenewWantedRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/wanted-requests/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew wanted request')
      }

      // Update local state
      setWantedRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: 'active', postedDate: new Date().toLocaleDateString() }
            : request
        )
      )

      alert(data.message || 'Wanted request renewed successfully')
    } catch (error: any) {
      console.error('Error renewing wanted request:', error)
      alert(error.message || 'Failed to renew wanted request')
    }
  }

  // Handle delete
  const handleDelete = async (requestId: string) => {
    if (!confirm('Move this wanted request to bin?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: requestId,
          item_type: 'wanted_request'
        })
      })

      if (!response.ok) throw new Error('Failed to delete wanted request')

      // Remove from local state
      setWantedRequests(prev => prev.filter(r => r.id !== requestId))
      alert('Wanted request moved to bin')
    } catch (error) {
      console.error('Error deleting wanted request:', error)
      alert('Failed to move wanted request to bin')
    }
  }

  // Handle share
  const handleShareWantedRequest = (requestId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this wanted request',
        url: `/wanted/${requestId}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/wanted/${requestId}`)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Wanted Requests</h1>
            <Link
              href="/wanted/post"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <span>+</span> Publish a Request
            </Link>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Tell the community what vehicle you're looking for and let sellers come to you.
            </p>

            {/* Content */}
            {wantedRequestsLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your wanted requests...</p>
              </div>
            ) : wantedRequests.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No wanted requests yet</p>
                <p className="text-sm text-gray-600 mb-4">Create your first wanted request to find your ideal vehicle</p>
                <Link
                  href="/wanted/post"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium inline-block"
                >
                  Post Your First Request
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Request</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Budget</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Clicks</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Posted</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {wantedRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <Link
                                href={`/wanted/${request.id}`}
                                className="font-medium text-blue-600 hover:text-blue-700"
                              >
                                {request.title}
                              </Link>
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {request.location}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">Rs. {request.budget?.toLocaleString() || '0'}</td>
                          <td className="px-4 py-4">{request.clicks}</td>
                          <td className="px-4 py-4">
                            <WantedRequestStatusBadge request={request} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{formatListingDate(request.postedDate)}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {request.status === 'active' && (
                                <>
                                  <button
                                    onClick={() => handleCloseWantedRequest(request.id)}
                                    className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1 font-medium transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Close
                                  </button>
                                  <Link
                                    href={`/wanted-request/paid-features?request=${request.id}`}
                                    className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600 inline-flex items-center gap-1 font-medium shadow-sm transition-all"
                                  >
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    Boost
                                  </Link>
                                </>
                              )}

                              {request.status === 'paused' && (
                                <>
                                  <button
                                    onClick={() => handlePauseResumeWantedRequest(request.id, 'resume')}
                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 flex items-center gap-1 font-medium transition-all"
                                  >
                                    <Play className="w-3 h-3" />
                                    Resume
                                  </button>
                                  <button
                                    onClick={() => handleCloseWantedRequest(request.id)}
                                    className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 flex items-center gap-1 font-medium transition-all"
                                  >
                                    <X className="w-3 h-3" />
                                    Close
                                  </button>
                                </>
                              )}

                              <WantedRequestActions
                                request={request}
                                onPause={(id) => handlePauseResumeWantedRequest(id, 'pause')}
                                onResume={(id) => handlePauseResumeWantedRequest(id, 'resume')}
                                onClose={handleCloseWantedRequest}
                                onDelete={(id) => handleDelete(id)}
                                onShare={handleShareWantedRequest}
                                viewMode="desktop"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {wantedRequests.map((request) => (
                    <div key={request.id} className="bg-white border rounded-lg shadow-sm">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/wanted/${request.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 block line-clamp-2 break-words flex-1 min-w-0"
                          >
                            {request.title}
                          </Link>
                          <button
                            onClick={() => setShowActionMenu(showActionMenu === request.id ? null : request.id)}
                            className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900">Rs. {request.budget?.toLocaleString() || '0'}</span>
                            <span className="text-xs text-gray-600">{request.clicks} clicks</span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {request.location}
                            </span>
                            <span>{formatListingDate(request.postedDate)}</span>
                          </div>

                          <div>
                            <WantedRequestStatusBadge request={request} />
                            <WantedRequestStatusMessage request={request} />
                          </div>

                          {/* Quick Actions */}
                          {request.status === 'active' && (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => handlePauseResumeWantedRequest(request.id, 'pause')}
                                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
                              >
                                Pause
                              </button>
                              <Link
                                href={`/wanted-request/paid-features?request=${request.id}`}
                                className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 text-center"
                              >
                                Boost
                              </Link>
                            </div>
                          )}

                          {request.status === 'paused' && (
                            <button
                              onClick={() => handlePauseResumeWantedRequest(request.id, 'resume')}
                              className="w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                            >
                              Resume
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Action Menu */}
                      {showActionMenu === request.id && (
                        <div className="border-t p-2">
                          <button
                            onClick={() => {
                              handleShareWantedRequest(request.id)
                              setShowActionMenu(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded"
                          >
                            <Share2 className="w-4 h-4" />
                            Share Request
                          </button>
                          <Link
                            href={`/wanted/edit/${request.id}`}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded block"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Request
                          </Link>
                          {(request.status === 'active' || request.status === 'paused') && (
                            <>
                              {request.status === 'active' && (
                                <button
                                  onClick={() => {
                                    handleRenewWantedRequest(request.id)
                                    setShowActionMenu(null)
                                  }}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded ${
                                    getDaysUntilWantedRequestRenewal(request.postedDate) > 0
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-gray-900'
                                  }`}
                                  disabled={getDaysUntilWantedRequestRenewal(request.postedDate) > 0}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  {getDaysUntilWantedRequestRenewal(request.postedDate) > 0
                                    ? `${getDaysUntilWantedRequestRenewal(request.postedDate)} days to renew`
                                    : 'Renew Request'
                                  }
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleCloseWantedRequest(request.id)
                                  setShowActionMenu(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 rounded"
                              >
                                <X className="w-4 h-4" />
                                Close Request
                              </button>
                            </>
                          )}
                          <hr className="my-2" />
                          <button
                            onClick={() => {
                              handleDelete(request.id)
                              setShowActionMenu(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                            Move to Bin
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

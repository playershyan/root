'use client'

import { useState } from 'react'
import { ArrowLeft, Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import StatusFilterDropdown from './components/StatusFilterDropdown'
import WantedLoadMoreButton from './components/WantedLoadMoreButton'
import WantedRequestStatusBadge from '@/app/components/wantedRequests/WantedRequestStatusBadge'
import WantedRequestActions from '@/app/components/wantedRequests/WantedRequestActions'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Helper function to format dates
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString().slice(-2)

  return `${hours}:${minutes} ${day}/${month}/${year}`
}

interface WantedRequest {
  id: string
  title: string
  description?: string
  min_budget?: number
  max_budget?: number
  status: string
  created_at: string
  clicks: number
  location: string
  is_reported?: boolean
  rejection_reason?: string
}

interface WantedPageClientProps {
  requests: WantedRequest[]
  totalCount: number
  hasMore: boolean
  statusFilter: string
  currentPage: number
}

export default function WantedPageClient({
  requests: initialRequests,
  totalCount,
  hasMore,
  statusFilter,
  currentPage
}: WantedPageClientProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [requests, setRequests] = useState(initialRequests)

  // Handle pause/resume
  const handlePauseResume = async (requestId: string, action: 'pause' | 'resume') => {
    try {
      const response = await fetch('/api/wanted-requests/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${action} wanted request`)
      }

      toast.success(`Wanted request ${action === 'pause' ? 'paused' : 'resumed'} successfully`)
      router.refresh()
    } catch (error) {
      logger.error(`Error ${action}ing wanted request`, error as Error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} wanted request`)
    }
  }

  // Handle close
  const handleClose = async (requestId: string) => {
    if (!confirm('Are you sure you want to close this wanted request? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/wanted-requests/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to close wanted request')
      }

      toast.success('Wanted request closed successfully')
      router.refresh()
    } catch (error) {
      logger.error('Error closing wanted request', error as Error)
      toast.error(error instanceof Error ? error.message : 'Failed to close wanted request')
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: requestId,
          item_type: 'wanted_request'
        })
      })

      if (!response.ok) throw new Error('Failed to delete wanted request')

      toast.success('Wanted request moved to bin')
      router.refresh()
    } catch (error) {
      logger.error('Error deleting wanted request', error as Error)
      toast.error('Failed to move wanted request to bin')
    }
  }

  // Handle share
  const handleShare = (requestId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this wanted request',
        url: `/wanted/${requestId}`
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/wanted/${requestId}`)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h1 className="text-2xl font-semibold">Wanted Requests</h1>
            <div className="flex gap-3 w-full sm:w-auto">
              <StatusFilterDropdown />
              <Button asChild variant="primary" size="default" className="gap-2 whitespace-nowrap">
                <Link href="/wanted/post">
                  <span>+</span> New Request
                </Link>
              </Button>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Tell the community what vehicle you're looking for and let sellers come to you.
            </p>

            {requests.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">
                  {statusFilter === 'all' ? 'No wanted requests yet' : `No ${statusFilter} requests`}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  {statusFilter === 'all' 
                    ? 'Create your first wanted request to find your ideal vehicle' 
                    : 'Try selecting a different filter'}
                </p>
                <Button asChild variant="primary" size="default">
                  <Link href="/wanted/post">Post Your First Request</Link>
                </Button>
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
                      {requests.map((request) => (
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
                          <td className="px-4 py-4">
                            Rs. {(request.max_budget || request.min_budget || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">{request.clicks}</td>
                          <td className="px-4 py-4">
                            <WantedRequestStatusBadge request={request as any} />
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <WantedRequestActions
                                request={request as any}
                                onPause={() => handlePauseResume(request.id, 'pause')}
                                onResume={() => handlePauseResume(request.id, 'resume')}
                                onClose={() => handleClose(request.id)}
                                onDelete={() => handleDelete(request.id)}
                                onShare={() => handleShare(request.id)}
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
                  {requests.map((request) => (
                    <div key={request.id} className="bg-white border rounded-lg shadow-sm">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <Link
                            href={`/wanted/${request.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 block line-clamp-2 break-words flex-1"
                          >
                            {request.title}
                          </Link>
                          <WantedRequestActions
                            request={request as any}
                            onPause={() => handlePauseResume(request.id, 'pause')}
                            onResume={() => handlePauseResume(request.id, 'resume')}
                            onClose={() => handleClose(request.id)}
                            onDelete={() => handleDelete(request.id)}
                            onShare={() => handleShare(request.id)}
                            viewMode="mobile"
                          />
                        </div>

                        <div className="space-y-3 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold text-gray-900">
                              Rs. {(request.max_budget || request.min_budget || 0).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-600">{request.clicks} clicks</span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {request.location}
                            </span>
                            <span>{formatDate(request.created_at)}</span>
                          </div>

                          <div>
                            <WantedRequestStatusBadge request={request as any} />
                          </div>

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                <WantedLoadMoreButton currentPage={currentPage} hasMore={hasMore} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


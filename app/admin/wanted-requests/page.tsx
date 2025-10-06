'use client'

import { useState, useEffect } from 'react'
import { Search, Clock, CheckCircle, XCircle, Eye, Filter, MessageSquare, User, MapPin, Calendar, DollarSign, AlertTriangle, Trash2 } from 'lucide-react'
import { useAdmin } from '../components/AdminProvider'

interface WantedRequest {
  id: string
  title: string
  description?: string
  vehicle_type?: string
  min_budget?: number
  max_budget?: number
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  location: string
  phone: string
  fuel_type?: string
  transmission?: string
  max_mileage?: number
  status: 'pending' | 'active' | 'paused' | 'deleted' | 'fulfilled'
  urgency?: 'high' | 'medium' | 'low'
  created_at: string
  approved_at?: string
  report_count: number
  view_count: number
  response_count: number
  user_id: string
  user_name: string
  user_email: string
  user_phone: string
  user_location: string
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `Rs. ${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(0)}K`
  }
  return `Rs. ${amount}`
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

export default function WantedRequestsManagement() {
  const { hasPermission } = useAdmin()
  const [requests, setRequests] = useState<WantedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'reported'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedRequest, setSelectedRequest] = useState<WantedRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (!hasPermission('moderate_listings')) {
      return
    }
    fetchRequests()
  }, [filter, page, searchTerm])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: filter === 'all' ? '' : filter === 'reported' ? 'active' : filter,
        page: page.toString(),
        search: searchTerm,
        ...(filter === 'reported' && { reported: 'true' }),
        ...(filter === 'pending' && { pending: 'true' })
      })

      const response = await fetch(`/api/admin/wanted-requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setTotalPages(data.totalPages)
        setTotalCount(data.totalCount)
      }
    } catch (error) {
      console.error('Failed to fetch wanted requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    const notes = prompt('Enter approval notes (optional):')

    try {
      const response = await fetch('/api/admin/wanted-requests/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, approvalNotes: notes })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        alert('Wanted request approved successfully!')
      } else {
        const data = await response.json()
        alert(`Failed to approve: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to approve wanted request:', error)
      alert('Failed to approve wanted request')
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const response = await fetch('/api/admin/wanted-requests/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        alert('Wanted request rejected successfully!')
      } else {
        const data = await response.json()
        alert(`Failed to reject: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to reject wanted request:', error)
      alert('Failed to reject wanted request')
    }
  }

  const handleDelete = async (requestId: string, permanent = false) => {
    const action = permanent ? 'permanently delete' : 'delete'
    const reason = prompt(`Enter reason to ${action} this request:`)
    if (!reason) return

    if (!confirm(`Are you sure you want to ${action} this wanted request?`)) return

    try {
      const response = await fetch('/api/admin/wanted-requests/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, reason, permanent })
      })

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        alert(`Wanted request ${action}d successfully!`)
      } else {
        const data = await response.json()
        alert(`Failed to ${action}: ${data.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${action} wanted request:`, error)
      alert(`Failed to ${action} wanted request`)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchRequests()
  }

  const getStatusBadge = (request: WantedRequest) => {
    if (request.report_count > 0) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {request.report_count} Reports
      </span>
    }

    if (!request.approved_at) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending Approval
      </span>
    }

    switch (request.status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      case 'paused':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Paused
        </span>
      case 'fulfilled':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Fulfilled
        </span>
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {request.status}
        </span>
    }
  }

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null

    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[urgency as keyof typeof colors]}`}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Priority
      </span>
    )
  }

  if (!hasPermission('moderate_listings')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view wanted requests management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wanted Requests Management</h1>
        <p className="text-gray-600 mt-1">Manage and moderate user wanted requests</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => !r.approved_at && r.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending Approval</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.report_count > 0).length}
          </div>
          <div className="text-sm text-gray-600">Reported</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'active' && r.approved_at).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            {[
              { key: 'pending', label: 'Pending Approval', count: requests.filter(r => !r.approved_at && r.status === 'pending').length },
              { key: 'active', label: 'Active', count: requests.filter(r => r.status === 'active').length },
              { key: 'reported', label: 'Reported', count: requests.filter(r => r.report_count > 0).length },
              { key: 'all', label: 'All', count: totalCount }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => {
                  setFilter(f.key as any)
                  setPage(1)
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">No wanted requests match your current filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 mb-1">{request.title}</div>
                        <div className="text-sm text-gray-600 mb-2">
                          {request.make && request.model && `${request.make} ${request.model}`}
                          {request.min_year && request.max_year && ` (${request.min_year}-${request.max_year})`}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {request.location}
                          <Calendar className="w-3 h-3 ml-2" />
                          {formatTimeAgo(request.created_at)}
                        </div>
                        {request.urgency && (
                          <div className="mt-2">
                            {getUrgencyBadge(request.urgency)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{request.user_name}</div>
                        <div className="text-sm text-gray-600">{request.user_email}</div>
                        <div className="text-sm text-gray-600">{request.user_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {request.min_budget && request.max_budget ? (
                          <span className="font-medium">
                            {formatCurrency(request.min_budget)} - {formatCurrency(request.max_budget)}
                          </span>
                        ) : request.min_budget ? (
                          <span className="font-medium">{formatCurrency(request.min_budget)}+</span>
                        ) : request.max_budget ? (
                          <span className="font-medium">Up to {formatCurrency(request.max_budget)}</span>
                        ) : (
                          <span className="text-gray-400">Not specified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(request)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Eye className="w-3 h-3" />
                          {request.view_count} views
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {request.response_count} responses
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {!request.approved_at && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(request.id, false)}
                          className="text-orange-600 hover:text-orange-800 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">Request Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedRequest.title}</h4>
                  {selectedRequest.description && (
                    <p className="text-gray-600 text-sm">{selectedRequest.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make & Model</label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.make} {selectedRequest.model}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year Range</label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.min_year} - {selectedRequest.max_year}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <div className="text-sm text-gray-900">
                      {selectedRequest.min_budget && selectedRequest.max_budget
                        ? `${formatCurrency(selectedRequest.min_budget)} - ${formatCurrency(selectedRequest.max_budget)}`
                        : selectedRequest.min_budget
                        ? `${formatCurrency(selectedRequest.min_budget)}+`
                        : selectedRequest.max_budget
                        ? `Up to ${formatCurrency(selectedRequest.max_budget)}`
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <div className="text-sm text-gray-900">{selectedRequest.location}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact</label>
                    <div className="text-sm text-gray-900">{selectedRequest.phone}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Posted</label>
                    <div className="text-sm text-gray-900">{new Date(selectedRequest.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {!selectedRequest.approved_at && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedRequest.id)
                          setShowDetails(false)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedRequest.id)
                          setShowDetails(false)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleDelete(selectedRequest.id, false)
                      setShowDetails(false)
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
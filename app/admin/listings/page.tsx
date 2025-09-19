'use client'

import { useState, useEffect } from 'react'
import { Car, Clock, CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react'
import { useAdmin } from '../components/AdminProvider'

interface Listing {
  id: string
  title: string
  price: number
  status: 'pending' | 'active' | 'sold' | 'deleted'
  make: string
  model: string
  year: number
  location: string
  phone: string
  user_id: string
  created_at: string
  report_count: number
  views: number
  image_url?: string
}

export default function ListingsManagement() {
  const { hasPermission } = useAdmin()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'reported'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!hasPermission('moderate_listings')) {
      return
    }
    fetchListings()
  }, [filter, page])

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: filter === 'all' ? '' : filter === 'reported' ? 'active' : filter,
        page: page.toString(),
        search: searchTerm,
        ...(filter === 'reported' && { reported: 'true' })
      })

      const response = await fetch(`/api/admin/listings?${params}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (listingId: string) => {
    if (!confirm('Approve this listing?')) return

    try {
      const response = await fetch('/api/admin/listings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })

      if (response.ok) {
        setListings(prev => prev.filter(l => l.id !== listingId))
        // Show success notification
      }
    } catch (error) {
      console.error('Failed to approve listing:', error)
    }
  }

  const handleReject = async (listingId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const response = await fetch('/api/admin/listings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, reason })
      })

      if (response.ok) {
        setListings(prev => prev.filter(l => l.id !== listingId))
        // Show success notification
      }
    } catch (error) {
      console.error('Failed to reject listing:', error)
    }
  }

  if (!hasPermission('moderate_listings')) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to manage listings</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Listings Management</h1>
        <p className="text-gray-600 mt-1">Review and moderate vehicle listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            {[
              { value: 'pending', label: 'Pending', color: 'yellow' },
              { value: 'active', label: 'Active', color: 'green' },
              { value: 'reported', label: 'Reported', color: 'red' },
              { value: 'all', label: 'All', color: 'gray' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilter(tab.value as any)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.value
                    ? `bg-${tab.color}-100 text-${tab.color}-700`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchListings()}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Listing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metrics
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No listings found
                  </td>
                </tr>
              ) : (
                listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {listing.image_url && (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-16 h-16 object-cover rounded-lg mr-4"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                          <p className="text-sm text-gray-500">
                            {listing.make} {listing.model} ({listing.year})
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">LKR {listing.price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{listing.location}</p>
                      <p className="text-xs text-gray-500">{listing.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        listing.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : listing.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.status}
                      </span>
                      {listing.report_count > 0 && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {listing.report_count} reports
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {listing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(listing.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(listing.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
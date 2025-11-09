'use client'

import { useState, useEffect } from 'react'
import { Search, Building, Star, MapPin, Phone, Mail, Globe, Calendar } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  total_reviews?: number
  is_verified: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  user?: {
    email: string
    full_name?: string
  }
}

export default function BusinessPage() {
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/admin/business-profiles')
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses || [])
      }
    } catch (error) {
      logger.error('Failed to fetch businesses', error as Error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = searchTerm === '' ||
      business.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'verified' && business.is_verified) ||
      (filterStatus === 'unverified' && !business.is_verified) ||
      (filterStatus === 'featured' && business.is_featured)

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatRating = (rating?: number) => {
    if (!rating) return 'No ratings'
    return `${rating.toFixed(1)} / 5.0`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Management</h1>
        <p className="text-gray-600">Manage business profiles and verification status</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Businesses</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="featured">Featured</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Building size={20} className="text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Total Businesses</p>
              <p className="text-xl font-semibold">{businesses.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Star size={20} className="text-green-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-xl font-semibold">{businesses.filter(b => b.is_verified).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Star size={20} className="text-purple-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-xl font-semibold">{businesses.filter(b => b.is_featured).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Star size={20} className="text-yellow-500 mr-2" />
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-xl font-semibold">
                {businesses.length > 0
                  ? (businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredBusinesses.map((business) => (
          <div key={business.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {business.business_name}
                  </h3>
                  {business.is_verified && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Verified
                    </span>
                  )}
                  {business.is_featured && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Featured
                    </span>
                  )}
                </div>

                {business.rating && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">
                      {formatRating(business.rating)} ({business.total_reviews || 0} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {business.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {business.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {business.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-2 text-gray-400" />
                  {business.address}
                </div>
              )}

              {business.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={14} className="mr-2 text-gray-400" />
                  {business.phone}
                </div>
              )}

              {business.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2 text-gray-400" />
                  {business.email}
                </div>
              )}

              {business.website && (
                <div className="flex items-center text-sm text-gray-600">
                  <Globe size={14} className="mr-2 text-gray-400" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
              <div className="flex items-center">
                <Calendar size={12} className="mr-1" />
                Created {formatDate(business.created_at)}
              </div>

              {business.user && (
                <div className="text-right">
                  <p>Owner: {business.user.full_name || business.user.email}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {/* Handle view/edit */}}
              >
                View Details
              </button>

              {!business.is_verified && (
                <button
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => {/* Handle verification */}}
                >
                  Verify
                </button>
              )}

              <button
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  business.is_featured
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
                onClick={() => {/* Handle feature toggle */}}
              >
                {business.is_featured ? 'Unfeature' : 'Feature'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="text-center py-12">
          <Building size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No businesses found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
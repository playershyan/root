'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, Car, AlertTriangle, CheckCircle, XCircle, 
  Eye, MessageSquare, Clock, TrendingUp, Shield,
  FileText, Flag, Settings, LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AdminStats {
  pendingListings: number
  activeListings: number
  totalUsers: number
  pendingReports: number
  todayListings: number
  todayReports: number
}

interface Listing {
  id: string
  title: string
  price: number
  status: string
  created_at: string
  user: {
    name: string
    email: string
    phone: string
  }
  reports: any[]
  report_count: number
}

interface Report {
  id: string
  reason: string
  description: string
  created_at: string
  status: string
  listing?: {
    id: string
    title: string
    report_count: number
  }
  wanted_request?: {
    id: string
    title: string
    report_count: number
  }
  reporter: {
    name: string
    email: string
  }
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    pendingListings: 0,
    activeListings: 0,
    totalUsers: 0,
    pendingReports: 0,
    todayListings: 0,
    todayReports: 0
  })
  const [listings, setListings] = useState<Listing[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [listingsPage, setListingsPage] = useState(1)
  const [reportsPage, setReportsPage] = useState(1)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    checkAdminAccess()
    loadDashboardData()
  }, [user])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/admin/listings?limit=1')
      if (response.status === 403 || response.status === 401) {
        router.push('/')
        return
      }
    } catch (error) {
      console.error('Admin access check failed:', error)
      router.push('/')
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load stats, listings, and reports in parallel
      const [statsRes, listingsRes, reportsRes] = await Promise.all([
        loadStats(),
        loadListings('pending'),
        loadReports('pending')
      ])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    // This would typically come from a dedicated stats API
    // For now, we'll calculate from the data we fetch
    setStats({
      pendingListings: 0,
      activeListings: 0,
      totalUsers: 0,
      pendingReports: 0,
      todayListings: 0,
      todayReports: 0
    })
  }

  const loadListings = async (status: string = 'pending', page: number = 1) => {
    try {
      const response = await fetch(`/api/admin/listings?status=${status}&page=${page}`)
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])
        
        // Update stats
        if (status === 'pending') {
          setStats(prev => ({ ...prev, pendingListings: data.totalCount || 0 }))
        }
      }
    } catch (error) {
      console.error('Error loading listings:', error)
    }
  }

  const loadReports = async (status: string = 'pending', page: number = 1) => {
    try {
      const response = await fetch(`/api/admin/reports?status=${status}&page=${page}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
        
        // Update stats
        if (status === 'pending') {
          setStats(prev => ({ ...prev, pendingReports: data.totalCount || 0 }))
        }
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const handleApproveListing = async (listingId: string) => {
    try {
      const response = await fetch('/api/admin/listings/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
      })

      if (response.ok) {
        // Reload listings
        loadListings('pending')
        alert('Listing approved successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve listing')
      }
    } catch (error) {
      console.error('Error approving listing:', error)
      alert('Network error')
    }
  }

  const handleRejectListing = async (listingId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const response = await fetch('/api/admin/listings/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, rejectionReason: reason })
      })

      if (response.ok) {
        // Reload listings
        loadListings('pending')
        alert('Listing rejected successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject listing')
      }
    } catch (error) {
      console.error('Error rejecting listing:', error)
      alert('Network error')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount)
  }

  const getReasonLabel = (reason: string) => {
    const reasons: { [key: string]: string } = {
      inappropriate_content: 'Inappropriate Content',
      fraud_scam: 'Fraud/Scam',
      duplicate_listing: 'Duplicate Listing',
      wrong_category: 'Wrong Category',
      spam_advertising: 'Spam/Advertising'
    }
    return reasons[reason] || reason
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, Admin</span>
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                <LogOut size={16} />
                Exit Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Listings</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingListings}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
              </div>
              <Flag className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Listings</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeListings}</p>
              </div>
              <Car className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'listings', label: 'Pending Listings', icon: Car },
                { id: 'reports', label: 'Reports', icon: Flag },
                { id: 'approved', label: 'Approved Listings', icon: CheckCircle }
              ].map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      if (tab.id === 'listings') loadListings('pending')
                      if (tab.id === 'reports') loadReports('pending')
                      if (tab.id === 'approved') loadListings('active')
                    }}
                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <IconComponent size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'listings' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Listings</h2>
                {listings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending listings</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{listing.title}</h3>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              {formatCurrency(listing.price)}
                            </p>
                            <div className="text-sm text-gray-600 mt-2">
                              <p>Posted by: {listing.user?.name || 'Unknown'}</p>
                              <p>Email: {listing.user?.email}</p>
                              <p>Phone: {listing.user?.phone}</p>
                              <p>Date: {formatDate(listing.created_at)}</p>
                              {listing.report_count > 0 && (
                                <p className="text-red-600 font-medium">
                                  ⚠️ {listing.report_count} report(s)
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApproveListing(listing.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectListing(listing.id)}
                              className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Reports</h2>
                {reports.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending reports</p>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Flag className="w-4 h-4 text-red-600" />
                              <span className="font-semibold text-red-600">
                                {getReasonLabel(report.reason)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-800">
                              {report.listing?.title || report.wanted_request?.title}
                            </h3>
                            {report.description && (
                              <p className="text-gray-600 mt-1">{report.description}</p>
                            )}
                            <div className="text-sm text-gray-600 mt-2">
                              <p>Reported by: {report.reporter?.name}</p>
                              <p>Date: {formatDate(report.created_at)}</p>
                              <p className="font-medium text-orange-600">
                                Total reports for this item: {
                                  report.listing?.report_count || report.wanted_request?.report_count || 0
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              <Eye size={16} />
                              View Item
                            </button>
                            <button className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                              <CheckCircle size={16} />
                              Dismiss
                            </button>
                            <button className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                              <XCircle size={16} />
                              Take Action
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Approved Listings</h2>
                {listings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No approved listings</p>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing) => (
                      <div key={listing.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{listing.title}</h3>
                            <p className="text-lg font-bold text-blue-600 mt-1">
                              {formatCurrency(listing.price)}
                            </p>
                            <div className="text-sm text-gray-600 mt-2">
                              <p>Posted by: {listing.user?.name || 'Unknown'}</p>
                              <p>Date: {formatDate(listing.created_at)}</p>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              <Eye size={16} />
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
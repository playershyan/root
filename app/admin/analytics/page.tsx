'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Eye, Clock, Target, MousePointer, Smartphone, Monitor } from 'lucide-react'

interface AnalyticsData {
  pageViews: {
    total: number
    today: number
    week: number
    month: number
    trend: number[]
  }
  uniqueVisitors: {
    total: number
    today: number
    week: number
    month: number
    trend: number[]
  }
  userBehavior: {
    averageSessionDuration: number
    bounceRate: number
    pagesPerSession: number
    topPages: Array<{ path: string; views: number; bounceRate: number }>
  }
  demographics: {
    devices: { desktop: number; mobile: number; tablet: number }
    browsers: Array<{ name: string; percentage: number }>
    locations: Array<{ country: string; visits: number }>
  }
  conversion: {
    signupRate: number
    listingCreationRate: number
    inquiryRate: number
    conversionFunnel: Array<{ step: string; count: number; rate: number }>
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics || generateMockData())
      } else {
        setAnalytics(generateMockData())
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setAnalytics(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = (): AnalyticsData => ({
    pageViews: {
      total: 45789,
      today: 1234,
      week: 8901,
      month: 34567,
      trend: [1200, 1450, 1300, 1600, 1800, 1234, 1500]
    },
    uniqueVisitors: {
      total: 12345,
      today: 456,
      week: 2890,
      month: 9876,
      trend: [400, 520, 480, 600, 650, 456, 580]
    },
    userBehavior: {
      averageSessionDuration: 4.2,
      bounceRate: 34.5,
      pagesPerSession: 3.8,
      topPages: [
        { path: '/', views: 12345, bounceRate: 25.6 },
        { path: '/listings', views: 8901, bounceRate: 28.3 },
        { path: '/search', views: 5678, bounceRate: 45.2 },
        { path: '/listing/[id]', views: 4321, bounceRate: 15.7 },
        { path: '/wanted', views: 3456, bounceRate: 38.9 }
      ]
    },
    demographics: {
      devices: { desktop: 45, mobile: 48, tablet: 7 },
      browsers: [
        { name: 'Chrome', percentage: 68.5 },
        { name: 'Safari', percentage: 18.2 },
        { name: 'Firefox', percentage: 8.7 },
        { name: 'Edge', percentage: 3.1 },
        { name: 'Other', percentage: 1.5 }
      ],
      locations: [
        { country: 'Sri Lanka', visits: 15678 },
        { country: 'India', visits: 3456 },
        { country: 'UAE', visits: 1234 },
        { country: 'UK', visits: 987 },
        { country: 'USA', visits: 654 }
      ]
    },
    conversion: {
      signupRate: 12.5,
      listingCreationRate: 8.7,
      inquiryRate: 15.3,
      conversionFunnel: [
        { step: 'Visitors', count: 10000, rate: 100 },
        { step: 'Engaged Users', count: 6500, rate: 65 },
        { step: 'Signed Up', count: 1250, rate: 12.5 },
        { step: 'Created Listing', count: 108, rate: 8.7 },
        { step: 'Received Inquiry', count: 191, rate: 15.3 }
      ]
    }
  })

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
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
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Detailed insights into user behavior and platform performance</p>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.pageViews.total)}</p>
            </div>
            <Eye size={24} className="text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Today: {formatNumber(analytics.pageViews.today)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.uniqueVisitors.total)}</p>
            </div>
            <Users size={24} className="text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Today: {formatNumber(analytics.uniqueVisitors.today)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Session</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.userBehavior.averageSessionDuration)}</p>
            </div>
            <Clock size={24} className="text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Pages/Session: {analytics.userBehavior.pagesPerSession}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.userBehavior.bounceRate)}</p>
            </div>
            <Target size={24} className="text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-600">Lower is better</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-4">
            {analytics.userBehavior.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{page.path}</p>
                  <p className="text-xs text-gray-500">
                    {formatNumber(page.views)} views • {formatPercentage(page.bounceRate)} bounce rate
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">#{index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Monitor size={20} className="text-blue-500 mr-3" />
                <span className="text-gray-900">Desktop</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${analytics.demographics.devices.desktop}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analytics.demographics.devices.desktop}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone size={20} className="text-green-500 mr-3" />
                <span className="text-gray-900">Mobile</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${analytics.demographics.devices.mobile}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analytics.demographics.devices.mobile}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MousePointer size={20} className="text-purple-500 mr-3" />
                <span className="text-gray-900">Tablet</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                  <div
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${analytics.demographics.devices.tablet}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analytics.demographics.devices.tablet}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browser Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Usage</h3>
          <div className="space-y-3">
            {analytics.demographics.browsers.map((browser) => (
              <div key={browser.name} className="flex items-center justify-between">
                <span className="text-gray-900">{browser.name}</span>
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{ width: `${browser.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{formatPercentage(browser.percentage)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {analytics.demographics.locations.map((location, index) => (
              <div key={location.country} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-400 mr-3">#{index + 1}</span>
                  <span className="text-gray-900">{location.country}</span>
                </div>
                <span className="text-sm font-medium">{formatNumber(location.visits)} visits</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <div className="space-y-4">
            {analytics.conversion.conversionFunnel.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-medium">{step.step}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{formatNumber(step.count)}</span>
                    <span className="text-sm font-medium">{formatPercentage(step.rate)}</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full">
                  <div
                    className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${step.rate}%` }}
                  ></div>
                </div>
                {index < analytics.conversion.conversionFunnel.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-400"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
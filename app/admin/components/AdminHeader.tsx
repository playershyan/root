'use client'

import { useState, useEffect } from 'react'
import { Bell, User, Search, Moon, Sun, X } from 'lucide-react'
import { useAdmin } from './AdminProvider'
import { logger } from '@/lib/utils/logger'

export default function AdminHeader() {
  const { user } = useAdmin()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    fetchUnreadAlerts()
  }, [])

  const fetchUnreadAlerts = async () => {
    try {
      const response = await fetch('/api/admin/alerts/unread-count')
      if (response.ok) {
        const data = await response.json()
        setUnreadAlerts(data.count)
      }
    } catch (error) {
      logger.error('Failed to fetch unread alerts', error as Error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 lg:ml-64">
      <div className="px-3 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
        {/* Mobile: Stacked layout */}
        <div className="lg:hidden space-y-3">
          {/* Top row: Actions and user */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Alerts */}
              <button 
                className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="View alerts"
              >
                <Bell size={20} />
                {unreadAlerts > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadAlerts}
                  </span>
                )}
              </button>
            </div>

            {/* User info - compact */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-gray-900 truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-white" />
              </div>
            </div>
          </div>

          {/* Search bar - collapsible on mobile */}
          {showSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-10 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
            >
              <Search size={18} className="text-gray-400" />
              <span className="text-sm">Search...</span>
            </button>
          )}
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Search bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4 ml-4">
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Alerts */}
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
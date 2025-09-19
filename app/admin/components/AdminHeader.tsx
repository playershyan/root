'use client'

import { useState, useEffect } from 'react'
import { Bell, User, Search, Moon, Sun } from 'lucide-react'
import { useAdmin } from './AdminProvider'

export default function AdminHeader() {
  const { user } = useAdmin()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [unreadAlerts, setUnreadAlerts] = useState(0)

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
      console.error('Failed to fetch unread alerts:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 lg:ml-64">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
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
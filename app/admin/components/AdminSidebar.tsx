'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Car, Flag, Building2, Shield,
  Database, Bell, Settings, ChevronRight, Menu, X,
  TrendingUp, FileText, Calendar, Mail, Search
} from 'lucide-react'
import { useAdmin } from './AdminProvider'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'view_dashboard',
  },
  {
    label: 'Listings',
    href: '/admin/listings',
    icon: Car,
    permission: 'moderate_listings',
  },
  {
    label: 'Wanted Requests',
    href: '/admin/wanted-requests',
    icon: Search,
    permission: 'moderate_listings',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'manage_users',
  },
  {
    label: 'Business Profiles',
    href: '/admin/business',
    icon: Building2,
    permission: 'moderate_listings',
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: Flag,
    permission: 'moderate_reports',
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    permission: 'view_analytics',
  },
  {
    label: 'Security',
    href: '/admin/security',
    icon: Shield,
    permission: 'view_security',
  },
  {
    label: 'Data Management',
    href: '/admin/data',
    icon: Database,
    permission: 'manage_data',
  },
  {
    label: 'Alerts',
    href: '/admin/alerts',
    icon: Bell,
    permission: 'manage_alerts',
  },
  {
    label: 'Templates',
    href: '/admin/templates',
    icon: FileText,
    permission: 'manage_templates',
  },
  {
    label: 'Cron Jobs',
    href: '/admin/cron',
    icon: Calendar,
    permission: 'view_cron',
  },
  {
    label: 'Messages',
    href: '/admin/messages',
    icon: Mail,
    permission: 'manage_messages',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'manage_settings',
  },
]

export default function AdminSidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const { hasPermission } = useAdmin()

  const filteredMenuItems = menuItems.filter(item => hasPermission(item.permission))

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile toggle - positioned to avoid header conflicts */}
      <button
        className="lg:hidden fixed top-16 left-3 sm:left-4 z-50 p-2.5 bg-white rounded-lg shadow-lg border border-gray-200 touch-manipulation"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMobileOpen}
      >
        {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 w-[280px] sm:w-64 h-full bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:w-64
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Management Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
            <ul className="space-y-1">
              {filteredMenuItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-lg transition-colors touch-manipulation
                        ${isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }
                      `}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <Icon size={20} className="flex-shrink-0" />
                      <span className="text-sm sm:text-base">{item.label}</span>
                      {isActive && <ChevronRight size={16} className="ml-auto flex-shrink-0" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2.5 sm:py-2 text-gray-600 hover:text-gray-900 transition-colors touch-manipulation rounded-lg hover:bg-gray-50"
              onClick={() => setIsMobileOpen(false)}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <span className="text-sm sm:text-base">Exit Admin</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
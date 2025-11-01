'use client'

import { useState, useEffect } from 'react'
import { X, User, Bell, Building2, Shield, Trash2, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ProfileMenuProps {
  currentPage?: string
  hasBusinessProfile?: boolean
  userName?: string
  userInitials?: string
}

export default function ProfileMenu({
  currentPage = 'profile',
  hasBusinessProfile = false,
  userName = 'User',
  userInitials = 'U'
}: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false)
    // Close on any navigation
    return () => {
      setIsOpen(false)
    }
  }, [currentPage])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          href: '/profile?tab=profile',
          icon: User,
          label: 'My Profile',
          id: 'profile'
        },
        {
          href: '/profile?tab=notifications',
          icon: Bell,
          label: 'Notifications',
          id: 'notifications'
        },
        ...(hasBusinessProfile ? [{
          href: '/profile?tab=business',
          icon: Building2,
          label: 'Business Page',
          id: 'business'
        }] : [])
      ]
    },
    {
      title: 'Settings',
      items: [
        {
          href: '/profile?tab=security',
          icon: Shield,
          label: 'Account Settings',
          id: 'security'
        },
        {
          href: '/profile?tab=bin',
          icon: Trash2,
          label: 'Bin',
          id: 'bin'
        }
      ]
    }
  ]

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div className="fixed left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-xl md:hidden transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  {userInitials}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{userName}</h2>
                  <p className="text-xs text-gray-600">View Profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="overflow-y-auto h-[calc(100vh-140px)]">
              {menuSections.map((section, idx) => (
                <div key={idx} className="py-4">
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          currentPage === item.id
                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Logout */}
              <div className="border-t mt-4 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

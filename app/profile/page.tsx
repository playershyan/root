'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Shield, Bell, Car, Heart, Search, MessageSquare,
  Trash2, Building2, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBusinessProfile } from '../hooks/useBusinessProfile'
import { useListingManagement } from '../hooks/useListingManagement'
import { useFavorites } from '../hooks/useFavorites'
import { useMessaging } from '../hooks/useMessaging'

interface ProfileLink {
  title: string
  href: string
  icon: any
  badge?: number
}

export default function ProfileLandingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { businessProfile } = useBusinessProfile()
  const { listings } = useListingManagement(user?.id)
  const { favoritedAds, favoritedWantedRequests } = useFavorites(user?.id)
  const { conversations } = useMessaging(user?.id)

  const [unreadCount, setUnreadCount] = useState(0)

  // Calculate unread message count
  useEffect(() => {
    const count = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
    setUnreadCount(count)
  }, [conversations])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  const sections = [
    {
      title: 'Personal',
      links: [
        { title: 'Account Settings', href: '/profile/account', icon: User },
        { title: 'Security & Privacy', href: '/profile/security', icon: Shield },
        { title: 'Notifications', href: '/profile/notifications', icon: Bell }
      ]
    },
    {
      title: 'Content',
      links: [
        { title: 'My Listings', href: '/profile/listings', icon: Car, badge: listings.length },
        { title: 'Wanted Requests', href: '/profile/wanted', icon: Search },
        {
          title: 'Favorites',
          href: '/profile/favorites',
          icon: Heart,
          badge: favoritedAds.length + favoritedWantedRequests.length
        },
        {
          title: 'Messages',
          href: '/profile/messages',
          icon: MessageSquare,
          badge: unreadCount > 0 ? unreadCount : undefined
        }
      ]
    }
  ]

  if (businessProfile?.is_active) {
    sections.push({
      title: 'Business',
      links: [
        { title: 'Business Profile', href: '/profile/business', icon: Building2 }
      ]
    })
  }

  sections.push({
    title: 'Utilities',
    links: [
      { title: 'Bin', href: '/profile/bin', icon: Trash2 }
    ]
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
                {section.links.map((link) => (
                  <ProfileLink key={link.href} {...link} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProfileLink({ title, href, icon: Icon, badge }: ProfileLink) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          <span className="text-gray-900 font-medium">{title}</span>
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>
    </Link>
  )
}

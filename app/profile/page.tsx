'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Shield, Bell, Car, Heart, Search, MessageSquare,
  Trash2, Building2, ChevronRight, Settings
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useBusinessProfile } from '../hooks/useBusinessProfile'
import { useListingManagement } from '../hooks/useListingManagement'
import { useFavorites } from '../hooks/useFavorites'
import { useMessaging } from '../hooks/useMessaging'

interface ProfileLinkCard {
  title: string
  description: string
  href: string
  icon: any
  badge?: number
  color: string
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

  const personalLinks: ProfileLinkCard[] = [
    {
      title: 'Account Settings',
      description: 'Manage your personal profile and preferences',
      href: '/profile/account',
      icon: User,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Security & Privacy',
      description: 'Password, sessions, and account security',
      href: '/profile/security',
      icon: Shield,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Notifications',
      description: 'Email and SMS notification preferences',
      href: '/profile/notifications',
      icon: Bell,
      color: 'bg-purple-50 text-purple-600'
    }
  ]

  const contentLinks: ProfileLinkCard[] = [
    {
      title: 'My Listings',
      description: 'View and manage your vehicle listings',
      href: '/profile/listings',
      icon: Car,
      badge: listings.length,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Wanted Requests',
      description: 'Manage your vehicle wanted requests',
      href: '/profile/wanted',
      icon: Search,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Favorites',
      description: 'Your saved listings and requests',
      href: '/profile/favorites',
      icon: Heart,
      badge: favoritedAds.length + favoritedWantedRequests.length,
      color: 'bg-red-50 text-red-600'
    },
    {
      title: 'Messages',
      description: 'Your conversations with buyers and sellers',
      href: '/profile/messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
      color: 'bg-cyan-50 text-cyan-600'
    }
  ]

  const businessLinks: ProfileLinkCard[] = businessProfile?.is_active ? [
    {
      title: 'Business Profile',
      description: 'Manage your business page and information',
      href: '/profile/business',
      icon: Building2,
      color: 'bg-yellow-50 text-yellow-600'
    }
  ] : []

  const utilityLinks: ProfileLinkCard[] = [
    {
      title: 'Bin',
      description: 'Recover deleted items',
      href: '/profile/bin',
      icon: Trash2,
      color: 'bg-gray-50 text-gray-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account, content, and preferences</p>
        </div>

        {/* Personal Management Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Personal Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalLinks.map((link) => (
              <ProfileCard key={link.href} {...link} />
            ))}
          </div>
        </section>

        {/* Content & Activity Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Content & Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentLinks.map((link) => (
              <ProfileCard key={link.href} {...link} />
            ))}
          </div>
        </section>

        {/* Business Tools Section */}
        {businessLinks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessLinks.map((link) => (
                <ProfileCard key={link.href} {...link} />
              ))}
            </div>
          </section>
        )}

        {/* Utilities Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Utilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {utilityLinks.map((link) => (
              <ProfileCard key={link.href} {...link} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ProfileCard({ title, description, href, icon: Icon, badge, color }: ProfileLinkCard) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-300 group cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <div className="flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
          <span>View</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}

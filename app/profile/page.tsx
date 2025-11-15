import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import {
  User, Shield, Bell, Car, Search,
  Trash2, Building2, ChevronRight
} from 'lucide-react'
import { getProfileStats } from './utils/getProfileStats'

// Enable ISR with 60-second revalidation
// This means the page will be cached and regenerated every 60 seconds
export const revalidate = 60

interface ProfileLink {
  title: string
  href: string
  icon: any
  badge?: number
}

export default async function ProfileLandingPage() {
  // Get authenticated user (server-side)
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch profile stats (single optimized query)
  const stats = await getProfileStats(user.id)

  // Build sections with stats
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
        { 
          title: 'My Listings', 
          href: '/profile/listings', 
          icon: Car,
          badge: stats.listings_count > 0 ? stats.listings_count : undefined
        },
        { 
          title: 'Wanted Requests', 
          href: '/profile/wanted', 
          icon: Search,
          badge: stats.wanted_count > 0 ? stats.wanted_count : undefined
        }
      ]
    }
  ]

  // Add business section if user has active business profile
  if (stats.has_business_profile) {
    sections.push({
      title: 'Business',
      links: [
        { title: 'Business Profile', href: '/profile/business', icon: Building2 }
      ]
    })
  }

  // Add utilities section
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

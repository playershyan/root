'use client'

import { Car, Heart, Search, MessageSquare } from 'lucide-react'
import { useUnreadMessages } from '@/lib/hooks/useUnreadMessages'

interface MobileProfileTabsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  listingsCount?: number
  favoritesCount?: number
  wantedCount?: number
}

export default function MobileProfileTabs({
  activeTab,
  onTabChange,
  listingsCount = 0,
  favoritesCount = 0,
  wantedCount = 0
}: MobileProfileTabsProps) {
  const unreadCount = useUnreadMessages()

  const tabs = [
    {
      id: 'listings',
      label: 'My Ads',
      icon: Car,
      count: listingsCount
    },
    {
      id: 'favorites',
      label: 'Saved',
      icon: Heart,
      count: favoritesCount
    },
    {
      id: 'wanted',
      label: 'Wanted',
      icon: Search,
      count: wantedCount
    },
    {
      id: 'messages',
      label: 'Chat',
      icon: MessageSquare,
      badge: unreadCount
    }
  ]

  return (
    <div className="md:hidden bg-white border-b sticky top-0 z-40 shadow-sm">
      {/* Scrollable tab container */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-[90px] px-4 py-3 relative
                flex flex-col items-center gap-1
                transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {/* Icon with badge */}
              <div className="relative">
                <tab.icon className={`w-5 h-5 ${
                  activeTab === tab.id ? 'stroke-[2.5]' : 'stroke-2'
                }`} />

                {/* Badge for messages (unread count) */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-xs font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'font-semibold' : ''
              }`}>
                {tab.label}
              </span>

              {/* Count (for non-message tabs) */}
              {tab.count !== undefined && tab.badge === undefined && (
                <span className="text-[10px] text-gray-500">
                  {tab.count}
                </span>
              )}

              {/* Active indicator */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Add custom scrollbar hide CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

'use client'

import { Bell } from 'lucide-react'
import ProfileMenu from './ProfileMenu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MobileProfileHeaderProps {
  userName?: string
  userInitials?: string
  hasBusinessProfile?: boolean
  currentPage?: string
  onNotificationsClick?: () => void
  notificationCount?: number
}

export default function MobileProfileHeader({
  userName = 'User',
  userInitials = 'U',
  hasBusinessProfile = false,
  currentPage = 'profile',
  onNotificationsClick,
  notificationCount = 0
}: MobileProfileHeaderProps) {
  return (
    <header className="md:hidden bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: Hamburger Menu */}
        <ProfileMenu
          currentPage={currentPage}
          hasBusinessProfile={hasBusinessProfile}
          userName={userName}
          userInitials={userInitials}
        />

        {/* Center: Title */}
        <h1 className="text-lg font-semibold text-gray-900">My Profile</h1>

        {/* Right: Notifications & Avatar */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            onClick={onNotificationsClick}
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>

          {/* User Avatar */}
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}

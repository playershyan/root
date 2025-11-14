'use client'

import { useState } from 'react'
import { ArrowLeft, Bell, Check } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import NotificationsLoadMoreButton from './components/NotificationsLoadMoreButton'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'

// Helper to format date
function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link_url?: string
  is_read: boolean
  created_at: string
}

interface NotificationsPageClientProps {
  notifications: Notification[]
  unreadCount: number
  totalCount: number
  hasMore: boolean
  currentPage: number
}

export default function NotificationsPageClient({
  notifications: initialNotifications,
  unreadCount,
  totalCount,
  hasMore,
  currentPage
}: NotificationsPageClientProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAllRead, setMarkingAllRead] = useState(false)

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      })

      if (!response.ok) throw new Error('Failed to mark as read')

      router.refresh()
    } catch (error) {
      logger.error('Error marking notification as read', error as Error)
      toast.error('Failed to mark as read')
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true)
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to mark all as read')

      toast.success('All notifications marked as read')
      router.refresh()
    } catch (error) {
      logger.error('Error marking all notifications as read', error as Error)
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Handle delete notification
  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete notification')

      toast.success('Notification deleted')
      router.refresh()
    } catch (error) {
      logger.error('Error deleting notification', error as Error)
      toast.error('Failed to delete notification')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-semibold">Notifications</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAllRead}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  {markingAllRead ? 'Marking...' : 'Mark All as Read'}
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y">
            {notifications.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No notifications</p>
                <p className="text-sm text-gray-600">
                  We'll notify you when something interesting happens
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    {notification.link_url ? (
                      <Link
                        href={notification.link_url}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        className="block"
                      >
                        <NotificationContent notification={notification} />
                      </Link>
                    ) : (
                      <div onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}>
                        <NotificationContent notification={notification} />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatNotificationDate(notification.created_at)}
                      </span>
                      {!notification.is_read && (
                        <Button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="p-4">
                  <NotificationsLoadMoreButton currentPage={currentPage} hasMore={hasMore} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for notification content
function NotificationContent({ notification }: { notification: Notification }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
            {notification.title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </>
  )
}


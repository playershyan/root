import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, Bell, Check, X } from 'lucide-react'
import Link from 'next/link'
import { getNotifications } from './utils/getNotifications'
import NotificationsLoadMoreButton from './components/NotificationsLoadMoreButton'
import { Button } from '@/components/ui/button'

// Enable ISR with 10-second revalidation (more frequent for notifications)
export const revalidate = 10

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

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const params = await searchParams
  const currentPage = parseInt(params.page || '1')

  const { notifications, unreadCount, totalCount, hasMore } = await getNotifications(
    user.id,
    currentPage,
    20
  )

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
                <Button variant="outline" size="sm" disabled>
                  Mark All as Read
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y">
            {notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No notifications yet</p>
                <p className="text-sm text-gray-600">
                  We'll notify you about important updates here
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 rounded-full p-2 ${
                        !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Bell className={`w-4 h-4 ${
                          !notification.is_read ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-medium ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatNotificationDate(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                          >
                            View Details →
                          </Link>
                        )}
                      </div>
                      
                      {!notification.is_read && (
                        <button
                          disabled
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <NotificationsLoadMoreButton 
                  currentPage={currentPage}
                  hasMore={hasMore}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

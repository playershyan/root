import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, MessageSquare, Camera, User } from 'lucide-react'
import Link from 'next/link'
import { getConversations } from './utils/getConversations'
import MessagesLoadMoreButton from './components/MessagesLoadMoreButton'
import { Button } from '@/components/ui/button'

// Enable ISR with 10-second revalidation (more frequent for messages)
export const revalidate = 10

// Helper to format message timestamp
function formatMessageTime(dateString?: string): string {
  if (!dateString) return ''
  
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

export default async function MessagesPage({ searchParams }: PageProps) {
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

  const { conversations, totalCount, unreadCount, hasMore } = await getConversations(
    user.id,
    currentPage,
    20
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-gray-400" />
                <div>
                  <h1 className="text-2xl font-semibold">Messages</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          <div>
            {conversations.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No messages yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Start a conversation by contacting sellers on their listings
                </p>
                <Button asChild variant="primary" size="default">
                  <Link href="/">Browse Listings</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {conversations.map((conversation) => {
                    const otherUser = conversation.other_user
                    const listing = conversation.listing
                    const wantedRequest = conversation.wanted_request
                    const hasUnread = conversation.unread_count > 0

                    return (
                      <Link
                        key={conversation.id}
                        href={`/messages/${conversation.id}`}
                        className={`block hover:bg-gray-50 transition-colors ${
                          hasUnread ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              {otherUser?.avatar_url ? (
                                <img
                                  src={otherUser.avatar_url}
                                  alt={otherUser.name || 'User'}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              {hasUnread && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                                  {conversation.unread_count}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className={`font-medium truncate ${
                                  hasUnread ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {otherUser?.name || 'User'}
                                </p>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {formatMessageTime(conversation.last_message_at)}
                                </span>
                              </div>

                              {/* Item Preview */}
                              {listing && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {listing.image_url ? (
                                      <img
                                        src={listing.image_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Camera className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-600 truncate">{listing.title}</p>
                                    <p className="text-xs text-gray-500">Rs. {listing.price.toLocaleString()}</p>
                                  </div>
                                </div>
                              )}

                              {wantedRequest && (
                                <div className="mb-2">
                                  <p className="text-sm text-gray-600 truncate">{wantedRequest.title}</p>
                                  {wantedRequest.max_budget && (
                                    <p className="text-xs text-gray-500">Budget: Rs. {wantedRequest.max_budget.toLocaleString()}</p>
                                  )}
                                </div>
                              )}

                              {/* Last Message */}
                              {conversation.last_message && (
                                <p className={`text-sm truncate ${
                                  hasUnread ? 'font-medium text-gray-900' : 'text-gray-600'
                                }`}>
                                  {conversation.last_message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Load More */}
                <div className="p-4">
                  <MessagesLoadMoreButton 
                    currentPage={currentPage}
                    hasMore={hasMore}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

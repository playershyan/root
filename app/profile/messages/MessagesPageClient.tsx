'use client'

import { useState } from 'react'
import { ArrowLeft, MessageSquare, Camera, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import MessagesLoadMoreButton from './components/MessagesLoadMoreButton'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'

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

interface Conversation {
  id: string
  listing_title?: string
  listing_id?: string
  listing_image_url?: string
  other_user_name?: string
  other_user_avatar?: string
  last_message_preview?: string
  last_message_at?: string
  unread_count: number
}

interface MessagesPageClientProps {
  conversations: Conversation[]
  totalCount: number
  unreadCount: number
  hasMore: boolean
  currentPage: number
}

export default function MessagesPageClient({
  conversations: initialConversations,
  totalCount,
  unreadCount,
  hasMore,
  currentPage
}: MessagesPageClientProps) {
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)

  // Handle mark as read
  const handleMarkAsRead = async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}/mark-read`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to mark as read')

      toast.success('Marked as read')
      router.refresh()
    } catch (error) {
      logger.error('Error marking conversation as read', error as Error)
      toast.error('Failed to mark as read')
    }
  }

  // Handle delete conversation
  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Delete this conversation? This cannot be undone.')) return

    try {
      const response = await fetch(`/api/messaging/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete conversation')

      toast.success('Conversation deleted')
      router.refresh()
    } catch (error) {
      logger.error('Error deleting conversation', error as Error)
      toast.error('Failed to delete conversation')
    }
  }

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

          <div className="p-6">
            {conversations.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No conversations yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Start chatting with sellers or buyers
                </p>
                <Button asChild variant="primary" size="default">
                  <Link href="/">Browse Listings</Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Conversations List */}
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <Link
                      key={conv.id}
                      href={`/messages/${conv.id}`}
                      className="block"
                    >
                      <div className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${conv.unread_count > 0 ? 'bg-blue-50 border-blue-200' : ''}`}>
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {conv.other_user_avatar ? (
                              <img src={conv.other_user_avatar} alt={conv.other_user_name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </div>

                          {/* Listing Thumbnail */}
                          {conv.listing_image_url && (
                            <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                              <img src={conv.listing_image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {conv.other_user_name || 'Unknown User'}
                              </h3>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatMessageTime(conv.last_message_at)}
                              </span>
                            </div>
                            
                            {conv.listing_title && (
                              <p className="text-sm text-gray-600 mb-1 line-clamp-1">
                                Re: {conv.listing_title}
                              </p>
                            )}
                            
                            <p className={`text-sm ${conv.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'} line-clamp-2`}>
                              {conv.last_message_preview || 'No messages yet'}
                            </p>

                            {conv.unread_count > 0 && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {conv.unread_count} unread
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {conv.unread_count > 0 && (
                              <Button
                                onClick={(e) => handleMarkAsRead(conv.id, e)}
                                variant="outline"
                                size="sm"
                                title="Mark as read"
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Load More */}
                <MessagesLoadMoreButton currentPage={currentPage} hasMore={hasMore} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


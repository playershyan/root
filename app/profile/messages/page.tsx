'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useCallback, useState, useEffect } from 'react'
import MessagesTab from '@/app/components/messages/MessagesTab'
import { MessageData, ConversationData } from '@/lib/utils/messageUtils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch conversations - EXACT COPY FROM BACKUP
  const fetchConversations = useCallback(async () => {
    try {
      if (!user) {
        logger.debug('fetchConversations - User not loaded yet')
        return
      }

      logger.debug('fetchConversations - Fetching for user', { userId: user.id })

      // Use optimized API endpoint - single query with JOINs
      const response = await fetch('/api/messaging/conversations-optimized?limit=50&offset=0')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const { conversations: conversationsData } = await response.json()
      logger.debug('fetchConversations - Received conversations', { count: conversationsData?.length || 0 })

      // Transform to match ConversationData interface
      const transformedConversations = conversationsData?.map((conv: any) => ({
        id: conv.id,
        listing_id: conv.listing_id,
        listing_title: conv.listing_title,
        listing_price: conv.listing_price,
        listing_image_url: conv.listing_image_url,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview || '',
        unread_count: conv.buyer_id === user.id ? conv.buyer_unread_count : conv.seller_unread_count,
        is_archived: conv.buyer_id === user.id ? conv.buyer_archived : conv.seller_archived,
        current_user_role: (conv.buyer_id === user.id ? 'buyer' : 'seller') as 'buyer' | 'seller',
        buyer: {
          profiles: {
            name: conv.buyer_name || 'Unknown User',
            avatar_url: conv.buyer_avatar_url || ''
          }
        },
        seller: {
          profiles: {
            name: conv.seller_name || 'Unknown User',
            avatar_url: conv.seller_avatar_url || ''
          }
        }
      })) || []

      logger.debug('fetchConversations - Setting conversations', { count: transformedConversations.length })
      setConversations(transformedConversations)
    } catch (error) {
      logger.error('fetchConversations error', error as Error)
      setConversations([])
    }
  }, [user])

  // Fetch messages - EXACT COPY FROM BACKUP
  const handleFetchMessages = async (conversationId: string): Promise<MessageData[]> => {
    try {
      // Use optimized API endpoint - single query with JOINs, auto mark-as-read
      const response = await fetch(
        `/api/messaging/messages-optimized/${conversationId}?limit=100&markAsRead=true`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const { messages: messagesData } = await response.json()

      // Transform to match MessageData interface
      const transformedMessages = messagesData?.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        is_read: msg.is_read,
        created_at: msg.created_at,
        message_type: msg.message_type,
        offer_data: msg.offer_data,
        sender: {
          id: msg.sender_id,
          email: '', // Not needed for display
          profiles: {
            name: msg.sender_name || 'Unknown User',
            avatar_url: msg.sender_avatar_url || ''
          }
        }
      })) || []

      return transformedMessages
    } catch (error) {
      logger.error('Error fetching messages', error as Error)
      return []
    }
  }

  // Handle sending a message
  const handleSendMessage = useCallback(async (conversationId: string, content: string) => {
    try {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content
        })

      if (error) throw error
    } catch (error) {
      logger.error('Error sending message', error as Error)
      throw error
    }
  }, [user])

  // Handle archiving conversation (currently just logs)
  const handleArchiveConversation = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implement archive API endpoint
      logger.debug('Archiving conversation', { conversationId })
    } catch (error) {
      logger.error('Error archiving conversation', error as Error)
    }
  }, [])

  // Handle moving conversation to bin
  const handleMoveConversationToBin = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implement bin API endpoint or use existing delete handler
      logger.debug('Moving conversation to bin', { conversationId })
    } catch (error) {
      logger.error('Error moving conversation to bin', error as Error)
    }
  }, [])

  // Handle marking conversation as read
  const handleMarkConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Marking as read is handled automatically by the fetch messages endpoint
      // Just refresh conversations to update UI
      await fetchConversations()
    } catch (error) {
      logger.error('Error marking conversation as read', error as Error)
    }
  }, [fetchConversations])

  // Fetch conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => router.push('/profile')}
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Button>

        <MessagesTab
          conversations={conversations}
          currentUserId={user?.id}
          onFetchConversations={fetchConversations}
          onFetchMessages={handleFetchMessages}
          onSendMessage={handleSendMessage}
          onArchiveConversation={handleArchiveConversation}
          onMoveConversationToBin={handleMoveConversationToBin}
          onMarkConversationAsRead={handleMarkConversationAsRead}
          loading={loading}
        />
      </div>
    </div>
  )
}

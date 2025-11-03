'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useCallback, useState } from 'react'
import MessagesTab from '@/app/components/messages/MessagesTab'
import { MessageData, ConversationData } from '@/lib/utils/messageUtils'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch conversations - EXACT COPY FROM BACKUP
  const fetchConversations = useCallback(async () => {
    try {
      if (!user) {
        console.warn('[fetchConversations] User not loaded yet')
        return
      }

      console.log('[fetchConversations] Fetching for user:', user.id)

      // Use optimized API endpoint - single query with JOINs
      const response = await fetch('/api/messaging/conversations-optimized?limit=50&offset=0')

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const { conversations: conversationsData } = await response.json()
      console.log('[fetchConversations] Received', conversationsData?.length || 0, 'conversations')

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

      console.log('[fetchConversations] Setting', transformedConversations.length, 'conversations')
      setConversations(transformedConversations)
    } catch (error) {
      console.error('[fetchConversations] Error:', error)
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
      console.error('Error fetching messages:', error)
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
      console.error('Error sending message:', error)
      throw error
    }
  }, [user])

  // Handle archiving conversation (currently just logs)
  const handleArchiveConversation = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implement archive API endpoint
      console.log('Archiving conversation:', conversationId)
    } catch (error) {
      console.error('Error archiving conversation:', error)
    }
  }, [])

  // Handle moving conversation to bin
  const handleMoveConversationToBin = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implement bin API endpoint or use existing delete handler
      console.log('Moving conversation to bin:', conversationId)
    } catch (error) {
      console.error('Error moving conversation to bin:', error)
    }
  }, [])

  // Handle marking conversation as read
  const handleMarkConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Marking as read is handled automatically by the fetch messages endpoint
      // Just refresh conversations to update UI
      await fetchConversations()
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
  }, [fetchConversations])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

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

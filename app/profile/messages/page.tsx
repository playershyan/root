'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useMessaging } from '@/app/hooks/useMessaging'
import { useEffect, useCallback } from 'react'
import MessagesTab from '@/app/components/messages/MessagesTab'
import { MessageData } from '@/lib/utils/messageUtils'
import { supabase } from '@/lib/supabase'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const messaging = useMessaging(user?.id)

  useEffect(() => {
    if (user) {
      messaging.fetchConversations()
    }
  }, [user])

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

  // Handle fetching messages (wrapper to return messages)
  const handleFetchMessages = useCallback(async (conversationId: string): Promise<MessageData[]> => {
    await messaging.fetchMessages(conversationId, true)
    return messaging.messages
  }, [messaging])

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
    await messaging.markAsRead(conversationId)
  }, [messaging])

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
          conversations={messaging.conversations}
          currentUserId={user?.id}
          onFetchConversations={messaging.fetchConversations}
          onFetchMessages={handleFetchMessages}
          onSendMessage={handleSendMessage}
          onArchiveConversation={handleArchiveConversation}
          onMoveConversationToBin={handleMoveConversationToBin}
          onMarkConversationAsRead={handleMarkConversationAsRead}
          loading={messaging.loading}
        />
      </div>
    </div>
  )
}

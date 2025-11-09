/**
 * Messaging Hook
 * Centralized messaging state and operations
 */

import { useState, useCallback } from 'react'
import { api } from '@/lib/services/apiClient'
import { ConversationData, MessageData } from '@/lib/utils/messageUtils'
import { logger } from '@/lib/utils/logger'

interface UseMessagingReturn {
  conversations: ConversationData[]
  selectedConversation: string | null
  messages: MessageData[]
  loading: boolean
  messagesLoading: boolean

  // Operations
  fetchConversations: (limit?: number, offset?: number) => Promise<void>
  fetchMessages: (conversationId: string, markAsRead?: boolean) => Promise<void>
  selectConversation: (conversationId: string | null) => void
  markAsRead: (conversationId: string) => Promise<{ success: boolean; error?: string }>
  refreshConversation: (conversationId: string) => Promise<void>
}

export function useMessaging(userId?: string): UseMessagingReturn {
  const [conversations, setConversations] = useState<ConversationData[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Fetch conversations
  const fetchConversations = useCallback(async (limit = 50, offset = 0) => {
    if (!userId) return

    setLoading(true)
    try {
      const response = await api.get<{ conversations: ConversationData[] }>(
        `/api/messaging/conversations-optimized?limit=${limit}&offset=${offset}`
      )

      if (response.success && response.data) {
        setConversations(response.data.conversations || [])
      }
    } catch (error) {
      logger.error('Error fetching conversations', error as Error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string, markAsRead = true) => {
    setMessagesLoading(true)
    try {
      const response = await api.get<{ messages: MessageData[] }>(
        `/api/messaging/messages-optimized/${conversationId}?limit=100&markAsRead=${markAsRead}`
      )

      if (response.success && response.data) {
        setMessages(response.data.messages || [])

        // If marked as read, update conversation in local state
        if (markAsRead) {
          setConversations(prev =>
            prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, unread_count: 0 }
                : conv
            )
          )
        }
      }
    } catch (error) {
      logger.error('Error fetching messages', error as Error)
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  // Select conversation
  const selectConversation = useCallback((conversationId: string | null) => {
    setSelectedConversation(conversationId)
    if (conversationId) {
      fetchMessages(conversationId, true)
    } else {
      setMessages([])
    }
  }, [fetchMessages])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    const response = await api.post(`/api/messages/${conversationId}/mark-read`)

    if (response.success) {
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )
      return { success: true }
    }

    return {
      success: false,
      error: response.error || 'Failed to mark conversation as read'
    }
  }, [])

  // Refresh specific conversation
  const refreshConversation = useCallback(async (conversationId: string) => {
    await fetchMessages(conversationId, false)
  }, [fetchMessages])

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    messagesLoading,
    fetchConversations,
    fetchMessages,
    selectConversation,
    markAsRead,
    refreshConversation
  }
}

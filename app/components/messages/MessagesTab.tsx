'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { ConversationData, MessageData } from '@/lib/utils/messageUtils'
import MessagesList from './MessagesList'
import ConversationView from './ConversationView'

interface MessagesTabProps {
  conversations: ConversationData[]
  currentUserId?: string
  onFetchConversations: () => Promise<void>
  onFetchMessages: (conversationId: string) => Promise<MessageData[]>
  onSendMessage: (conversationId: string, content: string) => Promise<void>
  onArchiveConversation?: (conversationId: string) => Promise<void>
  onMoveConversationToBin?: (conversationId: string) => Promise<void>
  onMarkConversationAsRead?: (conversationId: string) => Promise<void>
  loading?: boolean
}

export default function MessagesTab({
  conversations,
  currentUserId,
  onFetchConversations,
  onFetchMessages,
  onSendMessage,
  onArchiveConversation,
  onMoveConversationToBin,
  onMarkConversationAsRead,
  loading = false
}: MessagesTabProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation)
    }
  }, [selectedConversation])

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const fetchedMessages = await onFetchMessages(conversationId)
      setMessages(fetchedMessages)

      // Automatically mark messages as read when conversation is opened
      if (onMarkConversationAsRead) {
        await onMarkConversationAsRead(conversationId)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return
    
    setSendingMessage(true)
    try {
      await onSendMessage(selectedConversation, content)
      // Refresh messages after sending
      await loadMessages(selectedConversation)
      // Refresh conversations to update last message
      await onFetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    setMessages([]) // Clear previous messages while loading
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setMessages([])
  }

  const handleArchive = async (conversationId: string) => {
    if (onArchiveConversation) {
      await onArchiveConversation(conversationId)
      await onFetchConversations() // Refresh the list
    }
  }

  const handleMoveToBin = async (conversationId: string) => {
    if (onMoveConversationToBin) {
      await onMoveConversationToBin(conversationId)
      await onFetchConversations() // Refresh the list
      // If current conversation was moved to bin, go back to list
      if (selectedConversation === conversationId) {
        handleBackToList()
      }
    }
  }

  const handleMarkAsRead = async (conversationId: string) => {
    if (onMarkConversationAsRead) {
      await onMarkConversationAsRead(conversationId)
      await onFetchConversations() // Refresh to update unread counts
    }
  }

  // If a conversation is selected, show the conversation view
  if (selectedConversation) {
    const conversation = conversations.find(c => c.id === selectedConversation)
    if (!conversation) {
      // Conversation not found, go back to list
      setSelectedConversation(null)
      return null
    }

    return (
      <div className="flex flex-col h-full">
        <ConversationView
          conversation={conversation}
          messages={messages}
          currentUserId={currentUserId}
          onBack={handleBackToList}
          onSendMessage={handleSendMessage}
          loadingMessages={loadingMessages}
          sendingMessage={sendingMessage}
        />
      </div>
    )
  }

  // Show conversations list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Messages
          </h1>
          <div className="flex items-center gap-4">
            {conversations.length > 0 && (
              <p className="text-sm text-gray-600">
                {conversations.filter(c => c.unread_count > 0).length} unread
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        <MessagesList
          conversations={conversations}
          onConversationSelect={handleConversationSelect}
          onArchive={handleArchive}
          onMoveToBin={handleMoveToBin}
          onMarkAsRead={handleMarkAsRead}
          loading={loading}
        />
      </div>
    </div>
  )
}
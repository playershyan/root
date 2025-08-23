'use client'

import { MessageSquare } from 'lucide-react'
import { ConversationData } from '@/lib/utils/messageUtils'
import MessagePreview from './MessagePreview'

interface MessagesListProps {
  conversations: ConversationData[]
  onConversationSelect: (conversationId: string) => void
  onArchive?: (conversationId: string) => void
  onMoveToBin?: (conversationId: string) => void
  onMarkAsRead?: (conversationId: string) => void
  loading?: boolean
}

export default function MessagesList({
  conversations,
  onConversationSelect,
  onArchive,
  onMoveToBin,
  onMarkAsRead,
  loading = false
}: MessagesListProps) {
  if (loading) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading conversations...</p>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-medium text-gray-900 mb-2">No messages yet</h3>
        <p className="text-sm max-w-md mx-auto">
          When you contact sellers about their listings or buyers respond to your ads, 
          your conversations will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(conversation => (
        <MessagePreview
          key={conversation.id}
          conversation={conversation}
          onClick={() => onConversationSelect(conversation.id)}
          onArchive={onArchive}
          onMoveToBin={onMoveToBin}
          onMarkAsRead={onMarkAsRead}
        />
      ))}
    </div>
  )
}
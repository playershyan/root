'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConversationData, MessageData } from '@/lib/utils/messageUtils'
import ConversationView from '@/app/components/messages/ConversationView'
import OfferModal from '@/app/components/messaging/OfferModal'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'

interface ConversationThreadClientProps {
  conversation: ConversationData
  initialMessages: MessageData[]
  currentUserId: string
  initialHasMore?: boolean
  initialCursor?: string | null
}

type OfferAction = 'accepted' | 'declined'

export default function ConversationThreadClient({
  conversation,
  initialMessages,
  currentUserId,
  initialHasMore = false,
  initialCursor = null
}: ConversationThreadClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<MessageData[]>(initialMessages)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [olderCursor, setOlderCursor] = useState<string | null>(initialCursor)
  const [loadingOlder, setLoadingOlder] = useState(false)

  const participantLookup = useMemo(() => ({
    [conversation.buyer_id]: {
      name: conversation.buyer.profiles.name,
      avatar_url: conversation.buyer.profiles.avatar_url
    },
    [conversation.seller_id]: {
      name: conversation.seller.profiles.name,
      avatar_url: conversation.seller.profiles.avatar_url
    }
  }), [conversation.buyer.profiles, conversation.buyer_id, conversation.seller.profiles, conversation.seller_id])

  useEffect(() => {
    setMessages(initialMessages)
    setHasMore(initialHasMore)
    setOlderCursor(initialCursor ?? initialMessages[0]?.created_at ?? null)
  }, [initialMessages, initialHasMore, initialCursor])

  useEffect(() => {
    const markRead = async () => {
      try {
        await fetch(`/api/messages/${conversation.id}/mark-read`, { method: 'PATCH' })
      } catch (error) {
        logger.error('Conversation thread - mark read failed', error as Error, {
          conversationId: conversation.id
        })
      }
    }
    markRead()
  }, [conversation.id])

  const mapMessageRecord = useCallback((record: any): MessageData => ({
    id: record.id,
    conversation_id: record.conversation_id,
    sender_id: record.sender_id,
    content: record.content,
    is_read: record.is_read,
    created_at: record.created_at,
    message_type: record.message_type || 'text',
    offer_data: record.offer_data || undefined,
    sender: {
      id: record.sender_id,
      email: '',
      profiles: {
        name: record.sender_name || participantLookup[record.sender_id]?.name || 'User',
        avatar_url: record.sender_avatar_url || participantLookup[record.sender_id]?.avatar_url || ''
      }
    }
  }), [participantLookup])

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        if (!payload.new) return
        setMessages((prev) => {
          if (prev.some((message) => message.id === payload.new.id)) {
            return prev
          }
          return [...prev, mapMessageRecord(payload.new)]
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
      }, (payload) => {
        if (!payload.new) return
        setMessages((prev) =>
          prev.map((message) => message.id === payload.new.id
            ? mapMessageRecord(payload.new)
            : message
          )
        )
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.debug('Realtime subscribed to conversation channel', {
          conversationId: conversation.id
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, mapMessageRecord])

  const handleSendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    const tempId = `temp-${Date.now()}`
    const optimisticMessage: MessageData = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: trimmed,
      is_read: true,
      created_at: new Date().toISOString(),
      message_type: 'text',
      sender: {
        id: currentUserId,
        email: '',
        profiles: {
          name: participantLookup[currentUserId]?.name || 'You',
          avatar_url: participantLookup[currentUserId]?.avatar_url || ''
        }
      }
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setSendingMessage(true)

    try {
      const response = await fetch(`/api/messaging/conversations/${conversation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: trimmed })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      if (result.message) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId ? mapMessageRecord(result.message) : message
          )
        )
      }
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== tempId))
      logger.error('Conversation thread - send message failed', error as Error, {
        conversationId: conversation.id
      })
      toast.error('Failed to send message. Please try again.')
      throw error
    } finally {
      setSendingMessage(false)
    }
  }, [conversation.id, currentUserId, mapMessageRecord, participantLookup])

  const handleOfferSubmit = useCallback(async (amount: number, note?: string) => {
    setOfferSubmitting(true)
    try {
      const response = await fetch('/api/messaging/send-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listingId: conversation.listing_id,
          sellerId: conversation.seller_id,
          amount,
          message: note,
          listingTitle: conversation.listing_title
        })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send offer')
      }

      if (result.message) {
        setMessages((prev) => {
          if (prev.some((message) => message.id === result.message.id)) {
            return prev
          }
          return [...prev, mapMessageRecord(result.message)]
        })
      }

      toast.success('Offer sent successfully')
    } catch (error) {
      logger.error('Conversation thread - send offer failed', error as Error, {
        conversationId: conversation.id
      })
      toast.error(error instanceof Error ? error.message : 'Failed to send offer')
      throw error
    } finally {
      setOfferSubmitting(false)
      setShowOfferModal(false)
    }
  }, [conversation.id, conversation.listing_id, conversation.listing_title, conversation.seller_id, mapMessageRecord])

  const handleOfferReaction = useCallback(async (offerId: string, action: OfferAction) => {
    try {
      const response = await fetch(`/api/messaging/offers/${offerId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to respond to offer')
      }

      toast.success(`Offer ${action === 'accepted' ? 'accepted' : 'declined'}`)

      setMessages((prev) =>
        prev.map((message) => {
          if (message.offer_data?.offerId === offerId) {
            return {
              ...message,
              offer_data: {
                ...message.offer_data,
                status: action
              }
            }
          }
          return message
        })
      )
    } catch (error) {
      logger.error('Conversation thread - offer reaction failed', error as Error, {
        conversationId: conversation.id,
        offerId
      })
      toast.error(error instanceof Error ? error.message : 'Failed to update offer')
      throw error
    }
  }, [conversation.id])

  const handleLoadOlder = useCallback(async () => {
    if (!hasMore || !olderCursor || loadingOlder) return
    setLoadingOlder(true)
    try {
      const response = await fetch(
        `/api/messaging/messages-optimized/${conversation.id}?limit=20&markAsRead=false&before=${encodeURIComponent(olderCursor)}`
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load messages')
      }

      const olderMessages: MessageData[] = (result.messages || []).map(mapMessageRecord)
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev])
        setOlderCursor(olderMessages[0].created_at)
      } else {
        setOlderCursor(null)
      }
      setHasMore(Boolean(result.hasMore))
    } catch (error) {
      logger.error('Conversation thread - load older failed', error as Error, {
        conversationId: conversation.id
      })
      toast.error(error instanceof Error ? error.message : 'Failed to load messages')
    } finally {
      setLoadingOlder(false)
    }
  }, [conversation.id, hasMore, loadingOlder, mapMessageRecord, olderCursor])

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <ConversationView
          conversation={conversation}
          messages={messages}
          currentUserId={currentUserId}
          onBack={() => router.push('/profile/messages')}
          onSendMessage={handleSendMessage}
          loadingMessages={false}
          sendingMessage={sendingMessage}
          onOfferAction={conversation.current_user_role === 'seller' ? handleOfferReaction : undefined}
          onMakeOffer={conversation.current_user_role === 'buyer' ? () => setShowOfferModal(true) : undefined}
          onLoadOlder={hasMore ? handleLoadOlder : undefined}
          hasMoreOlder={hasMore}
          loadingOlder={loadingOlder}
        />
      </div>

      {conversation.current_user_role === 'buyer' && (
        <OfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSendOffer={handleOfferSubmit}
          listingTitle={conversation.listing_title}
          listingPrice={conversation.listing_price}
          loading={offerSubmitting}
        />
      )}
    </div>
  )
}


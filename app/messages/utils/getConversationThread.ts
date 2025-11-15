import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import { ConversationData, MessageData } from '@/lib/utils/messageUtils'

export interface ConversationThreadResult {
  conversation: ConversationData
  messages: MessageData[]
  hasMore: boolean
  nextCursor: string | null
}

export async function getConversationThread(
  userId: string,
  conversationId: string,
  limit: number = 20
): Promise<ConversationThreadResult | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: conversationRow, error: conversationError } = await supabase
      .from('conversation_details')
      .select(`
        id,
        listing_id,
        listing_title,
        listing_price,
        listing_image_url,
        buyer_id,
        seller_id,
        buyer_unread_count,
        seller_unread_count,
        buyer_archived,
        seller_archived,
        last_message_at,
        last_message_preview,
        buyer_name,
        buyer_avatar_url,
        seller_name,
        seller_avatar_url
      `)
      .eq('id', conversationId)
      .maybeSingle()

    if (conversationError || !conversationRow) {
      logger.warn('Conversation thread - conversation not found', {
        conversationId,
        userId,
        error: conversationError?.message
      })
      return null
    }

    if (conversationRow.buyer_id !== userId && conversationRow.seller_id !== userId) {
      logger.warn('Conversation thread - unauthorized access attempt', {
        conversationId,
        userId
      })
      return null
    }

    const participants: Record<string, { name: string; avatar_url: string }> = {
      [conversationRow.buyer_id]: {
        name: conversationRow.buyer_name || 'Buyer',
        avatar_url: conversationRow.buyer_avatar_url || ''
      },
      [conversationRow.seller_id]: {
        name: conversationRow.seller_name || 'Seller',
        avatar_url: conversationRow.seller_avatar_url || ''
      }
    }

    const conversation: ConversationData = {
      id: conversationRow.id,
      listing_id: conversationRow.listing_id,
      listing_title: conversationRow.listing_title || 'Listing',
      listing_price: Number(conversationRow.listing_price) || 0,
      listing_image_url: conversationRow.listing_image_url || '',
      buyer_id: conversationRow.buyer_id,
      seller_id: conversationRow.seller_id,
      last_message_at: conversationRow.last_message_at || new Date().toISOString(),
      last_message_preview: conversationRow.last_message_preview || '',
      unread_count: conversationRow.buyer_id === userId
        ? (conversationRow.buyer_unread_count || 0)
        : (conversationRow.seller_unread_count || 0),
      is_archived: conversationRow.buyer_id === userId
        ? Boolean(conversationRow.buyer_archived)
        : Boolean(conversationRow.seller_archived),
      current_user_role: conversationRow.buyer_id === userId ? 'buyer' : 'seller',
      buyer: {
        profiles: {
          name: participants[conversationRow.buyer_id].name,
          avatar_url: participants[conversationRow.buyer_id].avatar_url
        }
      },
      seller: {
        profiles: {
          name: participants[conversationRow.seller_id].name,
          avatar_url: participants[conversationRow.seller_id].avatar_url
        }
      }
    }

    const messageFetchLimit = limit + 1
    const { data: messageRows, error: messagesError } = await supabase
      .from('message_details')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at,
        message_type,
        offer_data,
        sender_name,
        sender_avatar_url
      `)
      .eq('conversation_id', conversationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(messageFetchLimit)

    if (messagesError) {
      logger.error('Conversation thread - failed to fetch messages', messagesError as Error, {
        conversationId,
        userId
      })
      return {
        conversation,
        messages: [],
        hasMore: false,
        nextCursor: null
      }
    }

    let fetchedMessages = messageRows || []
    const hasMore = fetchedMessages.length > limit
    if (hasMore) {
      // remove the extra oldest record so we only return `limit`
      fetchedMessages = fetchedMessages.slice(0, limit)
    }

    const chronologicalMessages = [...fetchedMessages].reverse()
    const nextCursor = hasMore && chronologicalMessages.length > 0
      ? chronologicalMessages[0].created_at
      : null

    const messages: MessageData[] = chronologicalMessages
      .map((message) => ({
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        is_read: message.is_read,
        created_at: message.created_at,
        message_type: message.message_type as MessageData['message_type'],
        offer_data: message.offer_data || undefined,
        sender: {
          id: message.sender_id,
          email: '',
          profiles: {
            name: message.sender_name || participants[message.sender_id]?.name || 'User',
            avatar_url: message.sender_avatar_url || participants[message.sender_id]?.avatar_url || ''
          }
        }
      }))

    return { conversation, messages }
  } catch (error) {
    logger.error('Conversation thread - unexpected error', error as Error, {
      conversationId,
      userId
    })
    return null
  }
}



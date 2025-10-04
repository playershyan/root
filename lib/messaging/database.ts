/**
 * Messaging Database Layer
 * Optimized database operations for messaging functionality
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface Conversation {
  id: string
  listing_id: string | null
  listing_title: string
  listing_price: number | null
  listing_image_url: string | null
  buyer_id: string
  seller_id: string
  last_message_at: string
  last_message_preview: string | null
  buyer_unread_count: number
  seller_unread_count: number
  is_active: boolean
  buyer_archived: boolean
  seller_archived: boolean
  created_at: string
  updated_at: string
  // Computed fields
  current_user_role?: 'buyer' | 'seller'
  unread_count?: number
  is_archived?: boolean
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
  status: string
  message_type: string
  offer_data?: any
}

export interface CreateConversationData {
  listing_id: string
  listing_title: string
  listing_price?: number
  listing_image_url?: string
  buyer_id: string
  seller_id: string
  initial_message?: string
}

export interface CreateMessageData {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: string
  offer_data?: any
}

/**
 * Get conversations for a user with optimized query
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      listing_title,
      listing_price,
      listing_image_url,
      buyer_id,
      seller_id,
      last_message_at,
      last_message_preview,
      buyer_unread_count,
      seller_unread_count,
      is_active,
      buyer_archived,
      seller_archived,
      created_at,
      updated_at
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .eq('is_active', true)
    .order('last_message_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch conversations: ${error.message}`)
  }

  // Add computed fields
  return (data || []).map(conv => ({
    ...conv,
    current_user_role: conv.buyer_id === userId ? 'buyer' : 'seller',
    unread_count: conv.buyer_id === userId ? conv.buyer_unread_count : conv.seller_unread_count,
    is_archived: conv.buyer_id === userId ? conv.buyer_archived : conv.seller_archived
  }))
}

/**
 * Get conversation with messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const supabase = createServerComponentClient({ cookies })

  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      listing_title,
      listing_price,
      listing_image_url,
      buyer_id,
      seller_id,
      last_message_at,
      last_message_preview,
      buyer_unread_count,
      seller_unread_count,
      is_active,
      buyer_archived,
      seller_archived,
      created_at,
      updated_at
    `)
    .eq('id', conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .single()

  if (convError || !conversation) {
    return null
  }

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      is_read,
      read_at,
      created_at,
      updated_at,
      status,
      message_type,
      offer_data
    `)
    .eq('conversation_id', conversationId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (msgError) {
    throw new Error(`Failed to fetch messages: ${msgError.message}`)
  }

  // Mark messages as read
  await markMessagesAsRead(conversationId, userId)

  return {
    conversation: {
      ...conversation,
      current_user_role: conversation.buyer_id === userId ? 'buyer' : 'seller',
      unread_count: conversation.buyer_id === userId ? conversation.buyer_unread_count : conversation.seller_unread_count,
      is_archived: conversation.buyer_id === userId ? conversation.buyer_archived : conversation.seller_archived
    },
    messages: messages || []
  }
}

/**
 * Create or get existing conversation
 */
export async function createOrGetConversation(
  data: CreateConversationData
): Promise<{ conversation_id: string; existing: boolean }> {
  const supabase = createServerComponentClient({ cookies })

  // Check for existing conversation
  const { data: existingConv, error: existingError } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', data.listing_id)
    .eq('buyer_id', data.buyer_id)
    .eq('seller_id', data.seller_id)
    .eq('is_active', true)
    .single()

  if (existingError && existingError.code !== 'PGRST116') {
    throw new Error(`Database error: ${existingError.message}`)
  }

  if (existingConv) {
    return { conversation_id: existingConv.id, existing: true }
  }

  // Create new conversation
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({
      listing_id: data.listing_id,
      listing_title: data.listing_title,
      listing_price: data.listing_price,
      listing_image_url: data.listing_image_url,
      buyer_id: data.buyer_id,
      seller_id: data.seller_id,
      last_message_preview: data.initial_message ? data.initial_message.substring(0, 100) : null
    })
    .select('id')
    .single()

  if (convError) {
    throw new Error(`Failed to create conversation: ${convError.message}`)
  }

  // Create initial message if provided
  if (data.initial_message && newConv) {
    await createMessage({
      conversation_id: newConv.id,
      sender_id: data.buyer_id,
      content: data.initial_message
    })
  }

  return { conversation_id: newConv.id, existing: false }
}

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageData): Promise<Message> {
  const supabase = createServerComponentClient({ cookies })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content.trim(),
      message_type: data.message_type || 'text',
      offer_data: data.offer_data
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      is_read,
      read_at,
      created_at,
      updated_at,
      status,
      message_type,
      offer_data
    `)
    .single()

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`)
  }

  return message
}

/**
 * Mark messages as read using optimized database function
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<number> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .rpc('mark_messages_read', {
      p_conversation_id: conversationId,
      p_user_id: userId
    })

  if (error) {
    console.error('Failed to mark messages as read:', error)
    return 0
  }

  return data || 0
}

/**
 * Get listing information for conversation creation
 */
export async function getListingInfo(listingId: string): Promise<{
  id: string
  title: string
  price: number
  primary_image_url?: string
  image_url?: string
} | null> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price, primary_image_url, image_url')
    .eq('id', listingId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Log performance metrics
 */
export async function logPerformanceMetric(
  operation: string,
  durationMs: number,
  userId?: string,
  conversationId?: string
): Promise<void> {
  try {
    const supabase = createServerComponentClient({ cookies })

    await supabase
      .from('messaging_performance_log')
      .insert({
        operation,
        duration_ms: durationMs,
        user_id: userId,
        conversation_id: conversationId
      })
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error('Performance logging failed:', error)
  }
}
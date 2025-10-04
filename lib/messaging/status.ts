/**
 * Message Status System for Enhanced User Experience
 * Provides real-time feedback on message delivery and read status
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface MessageStatusUpdate {
  message_id: string
  status: MessageStatus
  timestamp: string
  retry_count?: number
}

export interface DeliveryReceipt {
  message_id: string
  conversation_id: string
  delivered_to: string
  delivered_at: string
  read_at?: string
}

/**
 * Update message status with optimistic UI updates
 */
export async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  userId: string
): Promise<void> {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Update message status in database
    const { error } = await supabase
      .from('messages')
      .update({
        status: status === 'failed' ? 'active' : 'active', // Keep as active but track delivery
        updated_at: new Date().toISOString(),
        delivery_status: status // New field to track delivery
      })
      .eq('id', messageId)
      .eq('sender_id', userId) // Ensure user owns the message

    if (error) {
      console.error('Failed to update message status:', error)
      throw new Error('Status update failed')
    }

    // Emit real-time status update
    await broadcastStatusUpdate(messageId, status)

  } catch (error) {
    console.error('Message status update error:', error)
    throw error
  }
}

/**
 * Mark messages as delivered when conversation is opened
 */
export async function markMessagesAsDelivered(
  conversationId: string,
  userId: string
): Promise<void> {
  const supabase = createServerComponentClient({ cookies })

  const { error } = await supabase
    .from('messages')
    .update({
      delivery_status: 'delivered',
      delivered_at: new Date().toISOString()
    })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId) // Only update messages not sent by current user
    .is('delivered_at', null) // Only update undelivered messages

  if (error) {
    console.error('Failed to mark messages as delivered:', error)
  }
}

/**
 * Broadcast status updates via real-time channel
 */
async function broadcastStatusUpdate(
  messageId: string,
  status: MessageStatus
): Promise<void> {
  // Implementation would use Supabase Realtime to broadcast status
  // This enables real-time status indicators in the UI
}

/**
 * Get comprehensive message analytics for UX insights
 */
export async function getMessageAnalytics(userId: string): Promise<{
  averageResponseTime: number
  messageSuccessRate: number
  popularQuickReplies: string[]
  peakActivityHours: number[]
}> {
  const supabase = createServerComponentClient({ cookies })

  // Analyze user's messaging patterns for UX optimization
  const { data: analytics } = await supabase
    .rpc('get_user_message_analytics', { user_id: userId })

  return {
    averageResponseTime: analytics?.avg_response_time || 0,
    messageSuccessRate: analytics?.success_rate || 1,
    popularQuickReplies: analytics?.popular_replies || [],
    peakActivityHours: analytics?.peak_hours || []
  }
}
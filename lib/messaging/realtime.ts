/**
 * Real-time Messaging with Supabase Realtime
 * Handles real-time message updates and notifications
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface RealtimeMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  message_type: string
}

export interface RealtimeConversationUpdate {
  id: string
  last_message_at: string
  last_message_preview: string
  buyer_unread_count: number
  seller_unread_count: number
}

export type MessageHandler = (message: RealtimeMessage) => void
export type ConversationHandler = (update: RealtimeConversationUpdate) => void
export type TypingHandler = (data: { conversation_id: string; user_id: string; typing: boolean }) => void

/**
 * Real-time messaging client
 */
export class MessagingRealtime {
  private supabase = createClientComponentClient()
  private messageChannels: Map<string, RealtimeChannel> = new Map()
  private conversationChannel: RealtimeChannel | null = null
  private userId: string | null = null

  /**
   * Initialize real-time client for user
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId
    await this.setupConversationChannel()
  }

  /**
   * Subscribe to messages in a specific conversation
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: MessageHandler,
    onTyping?: TypingHandler
  ): () => void {
    if (!this.userId) {
      console.error('MessagingRealtime not initialized')
      return () => {}
    }

    // Cleanup existing channel for this conversation
    this.unsubscribeFromConversation(conversationId)

    const channelName = `conversation:${conversationId}`
    const channel = this.supabase.channel(channelName)

    // Listen for new messages
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const message = payload.new as RealtimeMessage
          onMessage(message)
        }
      )

    // Listen for typing indicators if handler provided
    if (onTyping) {
      channel
        .on('broadcast', { event: 'typing' }, (payload) => {
          const data = payload.payload as { conversation_id: string; user_id: string; typing: boolean }
          if (data.user_id !== this.userId) {
            onTyping(data)
          }
        })
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to conversation ${conversationId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Failed to subscribe to conversation ${conversationId}`)
      }
    })

    this.messageChannels.set(conversationId, channel)

    // Return unsubscribe function
    return () => this.unsubscribeFromConversation(conversationId)
  }

  /**
   * Unsubscribe from conversation
   */
  unsubscribeFromConversation(conversationId: string): void {
    const channel = this.messageChannels.get(conversationId)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.messageChannels.delete(conversationId)
      console.log(`Unsubscribed from conversation ${conversationId}`)
    }
  }

  /**
   * Subscribe to all conversation updates for user
   */
  subscribeToConversationUpdates(onUpdate: ConversationHandler): () => void {
    if (!this.userId) {
      console.error('MessagingRealtime not initialized')
      return () => {}
    }

    if (this.conversationChannel) {
      this.supabase.removeChannel(this.conversationChannel)
    }

    this.conversationChannel = this.supabase.channel('conversation-updates')

    this.conversationChannel
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `or(buyer_id.eq.${this.userId},seller_id.eq.${this.userId})`
        },
        (payload) => {
          const update = payload.new as RealtimeConversationUpdate
          onUpdate(update)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to conversation updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to conversation updates')
        }
      })

    return () => {
      if (this.conversationChannel) {
        this.supabase.removeChannel(this.conversationChannel)
        this.conversationChannel = null
      }
    }
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, typing: boolean): void {
    if (!this.userId) return

    const channel = this.messageChannels.get(conversationId)
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversation_id: conversationId,
          user_id: this.userId,
          typing
        }
      })
    }
  }

  /**
   * Setup general conversation channel
   */
  private async setupConversationChannel(): Promise<void> {
    // This will be used for conversation-level updates
    // Implementation depends on specific needs
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    // Unsubscribe from all message channels
    for (const [conversationId] of this.messageChannels) {
      this.unsubscribeFromConversation(conversationId)
    }

    // Unsubscribe from conversation updates
    if (this.conversationChannel) {
      this.supabase.removeChannel(this.conversationChannel)
      this.conversationChannel = null
    }

    this.userId = null
    console.log('MessagingRealtime cleaned up')
  }
}

// Singleton instance
let realtimeInstance: MessagingRealtime | null = null

/**
 * Get or create messaging realtime instance
 */
export function getMessagingRealtime(): MessagingRealtime {
  if (!realtimeInstance) {
    realtimeInstance = new MessagingRealtime()
  }
  return realtimeInstance
}

/**
 * Cleanup messaging realtime instance
 */
export function cleanupMessagingRealtime(): void {
  if (realtimeInstance) {
    realtimeInstance.cleanup()
    realtimeInstance = null
  }
}
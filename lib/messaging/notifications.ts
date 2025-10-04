/**
 * Smart Notification System for Better User Engagement
 * Cost-effective notifications that improve response rates
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export interface NotificationPreferences {
  email_enabled: boolean
  browser_enabled: boolean
  instant_messages: boolean
  daily_summary: boolean
  new_inquiries: boolean
  price_changes: boolean
  response_reminders: boolean
  quiet_hours: {
    start: string // HH:MM format
    end: string   // HH:MM format
  }
}

export interface SmartNotification {
  id: string
  user_id: string
  type: 'new_message' | 'response_reminder' | 'conversation_summary' | 'engagement_tip'
  title: string
  message: string
  action_url?: string
  priority: 'low' | 'medium' | 'high'
  scheduled_at: string
  sent_at?: string
  read_at?: string
  conversion_tracked?: boolean
}

/**
 * Generate contextual notifications that drive engagement
 */
export async function createSmartNotifications(
  userId: string,
  conversationId: string,
  context: {
    messageCount: number
    lastResponseTime: number
    userRole: 'buyer' | 'seller'
    vehiclePrice: number
    daysSinceLastMessage: number
  }
): Promise<SmartNotification[]> {
  const notifications: SmartNotification[] = []

  // Response reminder for sellers (high conversion)
  if (context.userRole === 'seller' && context.daysSinceLastMessage >= 1 && context.messageCount > 0) {
    notifications.push({
      id: `reminder_${Date.now()}`,
      user_id: userId,
      type: 'response_reminder',
      title: 'Buyer waiting for your response',
      message: `A potential buyer is interested in your vehicle. Quick responses lead to 3x higher sales rates!`,
      action_url: `/messages?conversation=${conversationId}`,
      priority: 'high',
      scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    })
  }

  // Engagement tips for buyers
  if (context.userRole === 'buyer' && context.messageCount === 1 && context.daysSinceLastMessage >= 2) {
    notifications.push({
      id: `tip_${Date.now()}`,
      user_id: userId,
      type: 'engagement_tip',
      title: 'Increase your chances of getting the vehicle',
      message: `Try asking about inspection or test drive. Serious buyers get 2x more responses!`,
      action_url: `/messages?conversation=${conversationId}`,
      priority: 'medium',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
  }

  // Price negotiation suggestions
  if (context.messageCount >= 3 && !await hasDiscussedPrice(conversationId)) {
    notifications.push({
      id: `price_${Date.now()}`,
      user_id: userId,
      type: 'engagement_tip',
      title: context.userRole === 'buyer' ? 'Consider making an offer' : 'Buyer might be interested in negotiating',
      message: context.userRole === 'buyer'
        ? 'Most successful purchases involve some negotiation. Make a reasonable offer!'
        : 'The buyer seems interested. Being open to negotiation could close the deal faster.',
      action_url: `/messages?conversation=${conversationId}`,
      priority: 'medium',
      scheduled_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
    })
  }

  return notifications
}

/**
 * Check if conversation has discussed pricing
 */
async function hasDiscussedPrice(conversationId: string): Promise<boolean> {
  const supabase = createServerComponentClient({ cookies })

  const { data } = await supabase
    .from('messages')
    .select('content')
    .eq('conversation_id', conversationId)
    .ilike('content', '%price%,negotiat%,offer%,deal%')
    .limit(1)

  return (data?.length || 0) > 0
}

/**
 * Generate daily summary notifications
 */
export async function generateDailySummary(userId: string): Promise<SmartNotification | null> {
  const supabase = createServerComponentClient({ cookies })

  // Get user's conversation activity
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_title,
      buyer_unread_count,
      seller_unread_count,
      last_message_at,
      buyer_id,
      seller_id
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .eq('is_active', true)
    .gte('last_message_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (!conversations || conversations.length === 0) return null

  const totalUnread = conversations.reduce((sum, conv) => {
    return sum + (conv.buyer_id === userId ? conv.buyer_unread_count : conv.seller_unread_count)
  }, 0)

  const activeConversations = conversations.length
  const newConversations = conversations.filter(conv =>
    new Date(conv.last_message_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  ).length

  if (totalUnread === 0 && newConversations === 0) return null

  return {
    id: `summary_${userId}_${Date.now()}`,
    user_id: userId,
    type: 'conversation_summary',
    title: 'Your daily activity summary',
    message: `You have ${totalUnread} unread messages across ${activeConversations} conversations. ${newConversations} new conversations today.`,
    action_url: '/messages',
    priority: 'low',
    scheduled_at: new Date().toISOString()
  }
}

/**
 * Browser push notification helper
 */
export function sendBrowserNotification(
  title: string,
  message: string,
  options?: {
    icon?: string
    badge?: string
    tag?: string
    actionUrl?: string
  }
): void {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: message,
        icon: options?.icon || '/icon-192x192.png',
        badge: options?.badge || '/badge-72x72.png',
        tag: options?.tag || 'messaging',
        actions: options?.actionUrl ? [
          {
            action: 'view',
            title: 'View Message',
            icon: '/icons/view.png'
          }
        ] : undefined,
        data: {
          url: options?.actionUrl
        }
      })
    })
  }
}

/**
 * Smart notification timing based on user activity
 */
export function getOptimalNotificationTime(
  userTimezone: string,
  userActivityPattern: {
    peakHours: number[]
    weekdayActivity: boolean
    weekendActivity: boolean
  }
): Date {
  const now = new Date()
  const userHour = now.getHours()

  // If user is typically active now, send immediately
  if (userActivityPattern.peakHours.includes(userHour)) {
    return now
  }

  // Find next peak hour
  const nextPeakHour = userActivityPattern.peakHours.find(hour => hour > userHour)
  if (nextPeakHour) {
    const nextPeak = new Date()
    nextPeak.setHours(nextPeakHour, 0, 0, 0)
    return nextPeak
  }

  // If no peak hour today, use first peak hour tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  tomorrow.setHours(userActivityPattern.peakHours[0], 0, 0, 0)
  return tomorrow
}

/**
 * Track notification effectiveness for optimization
 */
export async function trackNotificationConversion(
  notificationId: string,
  action: 'viewed' | 'clicked' | 'ignored',
  userId: string
): Promise<void> {
  const supabase = createServerComponentClient({ cookies })

  await supabase
    .from('notification_analytics')
    .insert({
      notification_id: notificationId,
      user_id: userId,
      action,
      timestamp: new Date().toISOString()
    })
}
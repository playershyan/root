export interface MessageData {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  message_type?: 'text' | 'offer' | 'image' | 'file'
  offer_data?: {
    type: string
    offerId: string
    amount: number
    message?: string
    listingTitle?: string
    status?: 'pending' | 'accepted' | 'declined' | 'expired'
    responseMessage?: string | null
    respondedAt?: string | null
  }
  sender: {
    id: string
    email: string
    profiles: {
      name: string
      avatar_url: string
    }
  }
}

export interface ConversationData {
  id: string
  listing_id: string
  listing_title: string
  listing_price: number
  listing_image_url: string
  buyer_id: string
  seller_id: string
  last_message_at: string
  last_message_preview: string
  unread_count: number
  is_archived: boolean
  current_user_role: 'buyer' | 'seller'
  buyer: {
    profiles: {
      name: string
      avatar_url: string
    }
  }
  seller: {
    profiles: {
      name: string
      avatar_url: string
    }
  }
}

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}m ago`
    }
    return `${hours}h ago`
  } else if (days < 7) {
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('LKR', 'Rs.')
}

export function getOtherUser(conversation: ConversationData) {
  return conversation.current_user_role === 'buyer' 
    ? conversation.seller.profiles
    : conversation.buyer.profiles
}

export function shouldShowDateSeparator(
  currentMessage: MessageData, 
  previousMessage?: MessageData
): boolean {
  if (!previousMessage) return true
  
  return new Date(previousMessage.created_at).toDateString() !== 
         new Date(currentMessage.created_at).toDateString()
}

export function getDateSeparatorText(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}

export function truncateMessage(message: string, maxLength: number = 50): string {
  if (message.length <= maxLength) return message
  return message.substring(0, maxLength) + '...'
}
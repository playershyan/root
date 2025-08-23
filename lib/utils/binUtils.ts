export interface BinItemData {
  id: string
  title: string
  item_type: 'listing' | 'message' | 'wanted_request'
  deleted_at: string
  deletion_reason?: string
  can_restore: boolean
  days_until_permanent_deletion: number
  // Additional metadata based on item type
  price?: number
  location?: string
  seller?: string
  description?: string
  budget?: number
  responses?: number
  last_message?: string
  conversation_with?: string
}

export function formatDeletedDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      return 'Just now'
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

export function getDeletionUrgencyColor(daysRemaining: number): string {
  if (daysRemaining <= 3) {
    return 'text-red-600 bg-red-50'
  } else if (daysRemaining <= 7) {
    return 'text-orange-600 bg-orange-50'
  } else if (daysRemaining <= 14) {
    return 'text-yellow-600 bg-yellow-50'
  } else {
    return 'text-gray-600 bg-gray-50'
  }
}

export function getDeletionUrgencyMessage(daysRemaining: number): string {
  if (daysRemaining === 1) {
    return 'Deleting permanently tomorrow'
  } else if (daysRemaining <= 3) {
    return `Deleting permanently in ${daysRemaining} days`
  } else {
    return `${daysRemaining} days remaining`
  }
}

export function getItemTypeLabel(itemType: 'listing' | 'message' | 'wanted_request'): string {
  switch (itemType) {
    case 'listing':
      return 'Listing'
    case 'message':
      return 'Message'
    case 'wanted_request':
      return 'Wanted Request'
    default:
      return 'Item'
  }
}

export function getItemTypeIcon(itemType: 'listing' | 'message' | 'wanted_request'): string {
  switch (itemType) {
    case 'listing':
      return 'Car'
    case 'message':
      return 'MessageSquare'
    case 'wanted_request':
      return 'Search'
    default:
      return 'File'
  }
}

export function formatPrice(price?: number): string {
  if (!price) return ''
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('LKR', 'Rs.')
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
export interface FavoriteAdData {
  id: string
  title: string
  description?: string
  price: number
  location: string
  image?: string
  postedDate?: string
  seller?: string
  make?: string
  model?: string
  year?: number
  mileage?: number
}

export interface FavoriteWantedData {
  id: string
  title: string
  description: string
  budget: number
  location: string
  postedDate: string
  responses?: number
  urgency?: 'low' | 'medium' | 'high'
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('LKR', 'Rs.')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return 'Today'
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

export function truncateDescription(description: string, maxLength: number = 100): string {
  if (description.length <= maxLength) return description
  return description.substring(0, maxLength) + '...'
}

export function getUrgencyColor(urgency?: 'low' | 'medium' | 'high'): string {
  switch (urgency) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getUrgencyLabel(urgency?: 'low' | 'medium' | 'high'): string {
  switch (urgency) {
    case 'high':
      return 'Urgent'
    case 'medium':
      return 'Moderate'
    case 'low':
      return 'Flexible'
    default:
      return ''
  }
}
export function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    
    if (diffInMinutes < 60) return `Posted ${diffInMinutes} minutes ago`
    if (diffInHours < 24) return `Posted ${diffInHours} hours ago`
    if (diffInDays === 0) return 'Posted today'
    if (diffInDays === 1) return 'Posted yesterday'
    if (diffInDays < 7) return `Posted ${diffInDays} days ago`
    if (diffInWeeks < 4) return `Posted ${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
    return `Posted ${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`
  }
  
  export function getUrgencyClass(urgency?: string): string {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-orange-100 text-orange-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  export function formatBudgetRange(min?: number, max?: number): string {
    if (!min && !max) return 'Any Budget'
    if (!min) return `Up to Rs. ${max?.toLocaleString()}`
    if (!max) return `Rs. ${min.toLocaleString()}+`
    return `Rs. ${min.toLocaleString()} - Rs. ${max.toLocaleString()}`
  }
  
  export function formatYearRange(min?: number, max?: number): string {
    if (!min && !max) return 'Any Year'
    if (!min) return `Up to ${max}`
    if (!max) return `${min} onwards`
    return `${min} - ${max}`
  }
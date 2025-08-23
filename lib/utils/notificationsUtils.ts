export interface NotificationPreferences {
  // Email notifications
  emailNewMatches: boolean
  emailPriceDrops: boolean
  emailMessages: boolean
  emailListingUpdates: boolean
  
  // SMS notifications
  smsUrgent: boolean
  smsSecurity: boolean
  
  // Marketing communications
  marketingNewsletter: boolean
  marketingPromotions: boolean
}

export interface NotificationGroup {
  id: string
  title: string
  description: string
  icon: string
  preferences: NotificationPreference[]
}

export interface NotificationPreference {
  key: keyof NotificationPreferences
  label: string
  description: string
  type: 'email' | 'sms' | 'marketing'
  important?: boolean
}

export const notificationGroups: NotificationGroup[] = [
  {
    id: 'email',
    title: 'Email Notifications',
    description: 'Get notified via email about important events',
    icon: 'Mail',
    preferences: [
      {
        key: 'emailNewMatches',
        label: 'New matches for wanted requests',
        description: 'Receive emails when new listings match your wanted requests',
        type: 'email'
      },
      {
        key: 'emailPriceDrops',
        label: 'Price drops on favorited vehicles',
        description: 'Get notified when prices drop on vehicles you\'ve saved',
        type: 'email'
      },
      {
        key: 'emailMessages',
        label: 'New messages from buyers/sellers',
        description: 'Receive email notifications for new messages',
        type: 'email'
      },
      {
        key: 'emailListingUpdates',
        label: 'Updates on my listings',
        description: 'Get notified about views, inquiries, and status changes',
        type: 'email'
      }
    ]
  },
  {
    id: 'sms',
    title: 'SMS Notifications',
    description: 'Receive text messages for urgent notifications',
    icon: 'MessageSquare',
    preferences: [
      {
        key: 'smsUrgent',
        label: 'Urgent messages only',
        description: 'Only receive SMS for high-priority messages',
        type: 'sms',
        important: true
      },
      {
        key: 'smsSecurity',
        label: 'Security alerts',
        description: 'Security-related notifications and login alerts',
        type: 'sms',
        important: true
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing Communications',
    description: 'Stay informed about market trends and special offers',
    icon: 'TrendingUp',
    preferences: [
      {
        key: 'marketingNewsletter',
        label: 'Weekly newsletter',
        description: 'Market insights, tips, and featured listings',
        type: 'marketing'
      },
      {
        key: 'marketingPromotions',
        label: 'Special offers and promotions',
        description: 'Exclusive deals and promotional offers',
        type: 'marketing'
      }
    ]
  }
]

export function getNotificationIcon(type: 'email' | 'sms' | 'marketing'): string {
  switch (type) {
    case 'email':
      return 'Mail'
    case 'sms':
      return 'MessageSquare'
    case 'marketing':
      return 'TrendingUp'
    default:
      return 'Bell'
  }
}

export function getNotificationTypeColor(type: 'email' | 'sms' | 'marketing'): string {
  switch (type) {
    case 'email':
      return 'text-blue-600 bg-blue-50'
    case 'sms':
      return 'text-green-600 bg-green-50'
    case 'marketing':
      return 'text-purple-600 bg-purple-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export function validateNotificationPreferences(preferences: NotificationPreferences): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Check if all email notifications are disabled
  const emailEnabled = preferences.emailNewMatches || 
                      preferences.emailPriceDrops || 
                      preferences.emailMessages || 
                      preferences.emailListingUpdates
  
  if (!emailEnabled) {
    warnings.push('All email notifications are disabled. You may miss important updates.')
  }
  
  // Check if security SMS is disabled
  if (!preferences.smsSecurity) {
    warnings.push('Security SMS alerts are disabled. Consider enabling for account security.')
  }
  
  // Check if urgent SMS is disabled
  if (!preferences.smsUrgent) {
    warnings.push('Urgent SMS notifications are disabled. You may miss time-sensitive messages.')
  }
  
  return {
    isValid: true, // Always valid, just with warnings
    warnings
  }
}

export function getEnabledNotificationsCount(preferences: NotificationPreferences): {
  total: number
  byType: { email: number; sms: number; marketing: number }
} {
  const email = Number(preferences.emailNewMatches) + 
                Number(preferences.emailPriceDrops) + 
                Number(preferences.emailMessages) + 
                Number(preferences.emailListingUpdates)
  
  const sms = Number(preferences.smsUrgent) + 
              Number(preferences.smsSecurity)
  
  const marketing = Number(preferences.marketingNewsletter) + 
                   Number(preferences.marketingPromotions)
  
  return {
    total: email + sms + marketing,
    byType: { email, sms, marketing }
  }
}
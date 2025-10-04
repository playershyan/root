/**
 * Intelligent Quick Reply System
 * Context-aware and personalized quick replies for better UX
 */

export interface QuickReply {
  id: string
  text: string
  category: 'greeting' | 'inquiry' | 'negotiation' | 'scheduling' | 'closing'
  context: 'buyer' | 'seller' | 'both'
  priority: number
  usage_count?: number
}

export interface SmartQuickReplies {
  contextual: QuickReply[]
  personalized: QuickReply[]
  trending: QuickReply[]
}

/**
 * Enhanced quick replies based on vehicle marketplace context
 */
export const SMART_QUICK_REPLIES: QuickReply[] = [
  // Buyer inquiries
  {
    id: 'availability',
    text: "Is this still available?",
    category: 'inquiry',
    context: 'buyer',
    priority: 10
  },
  {
    id: 'inspection',
    text: "Can I inspect the vehicle?",
    category: 'scheduling',
    context: 'buyer',
    priority: 9
  },
  {
    id: 'test_drive',
    text: "When can I schedule a test drive?",
    category: 'scheduling',
    context: 'buyer',
    priority: 8
  },
  {
    id: 'price_negotiate',
    text: "Is the price negotiable?",
    category: 'negotiation',
    context: 'buyer',
    priority: 9
  },
  {
    id: 'vehicle_history',
    text: "Can you share the vehicle history?",
    category: 'inquiry',
    context: 'buyer',
    priority: 7
  },
  {
    id: 'service_records',
    text: "Do you have service records?",
    category: 'inquiry',
    context: 'buyer',
    priority: 6
  },
  {
    id: 'accident_history',
    text: "Has it been in any accidents?",
    category: 'inquiry',
    context: 'buyer',
    priority: 8
  },
  {
    id: 'financing',
    text: "Do you accept financing?",
    category: 'inquiry',
    context: 'buyer',
    priority: 7
  },
  {
    id: 'trade_in',
    text: "Do you consider trade-ins?",
    category: 'negotiation',
    context: 'buyer',
    priority: 5
  },

  // Seller responses
  {
    id: 'yes_available',
    text: "Yes, it's still available!",
    category: 'greeting',
    context: 'seller',
    priority: 10
  },
  {
    id: 'schedule_viewing',
    text: "Sure, when would you like to view it?",
    category: 'scheduling',
    context: 'seller',
    priority: 9
  },
  {
    id: 'price_firm',
    text: "The price is firm, but we can discuss payment options.",
    category: 'negotiation',
    context: 'seller',
    priority: 7
  },
  {
    id: 'documents_ready',
    text: "All documents are ready for viewing.",
    category: 'inquiry',
    context: 'seller',
    priority: 6
  },
  {
    id: 'thank_interest',
    text: "Thanks for your interest! Feel free to ask any questions.",
    category: 'greeting',
    context: 'seller',
    priority: 8
  },

  // Common responses
  {
    id: 'thank_you',
    text: "Thank you!",
    category: 'closing',
    context: 'both',
    priority: 5
  },
  {
    id: 'sounds_good',
    text: "Sounds good!",
    category: 'closing',
    context: 'both',
    priority: 6
  },
  {
    id: 'let_me_check',
    text: "Let me check and get back to you.",
    category: 'inquiry',
    context: 'both',
    priority: 4
  }
]

/**
 * Get contextual quick replies based on conversation state
 */
export function getContextualQuickReplies(
  userRole: 'buyer' | 'seller',
  conversationState: {
    messageCount: number
    lastMessageFromOther: string
    vehicleType: string
    priceRange: string
  },
  userPreferences?: {
    frequentlyUsed: string[]
    recentlyUsed: string[]
  }
): SmartQuickReplies {

  // Filter by user context
  const contextualReplies = SMART_QUICK_REPLIES
    .filter(reply => reply.context === userRole || reply.context === 'both')
    .sort((a, b) => b.priority - a.priority)

  // Get personalized replies based on usage patterns
  const personalizedReplies = userPreferences?.frequentlyUsed
    ?.map(text => ({
      id: `custom_${Date.now()}`,
      text,
      category: 'greeting' as const,
      context: 'both' as const,
      priority: 10
    })) || []

  // Context-aware filtering
  let smartReplies = contextualReplies

  if (conversationState.messageCount === 0) {
    // First message - prioritize greetings and inquiries
    smartReplies = smartReplies.filter(r =>
      r.category === 'greeting' || r.category === 'inquiry'
    )
  } else if (conversationState.lastMessageFromOther.toLowerCase().includes('price')) {
    // Price-related conversation - prioritize negotiation
    smartReplies = smartReplies.filter(r =>
      r.category === 'negotiation' || r.category === 'closing'
    )
  }

  return {
    contextual: smartReplies.slice(0, 6), // Top 6 contextual
    personalized: personalizedReplies.slice(0, 3), // Top 3 personal
    trending: getTrendingReplies().slice(0, 3) // Top 3 trending
  }
}

/**
 * Get trending quick replies based on system-wide usage
 */
function getTrendingReplies(): QuickReply[] {
  // In production, this would query actual usage analytics
  return SMART_QUICK_REPLIES
    .filter(r => r.priority >= 8)
    .slice(0, 5)
}

/**
 * Track quick reply usage for personalization
 */
export async function trackQuickReplyUsage(
  userId: string,
  replyText: string,
  context: 'buyer' | 'seller'
): Promise<void> {
  try {
    // In production, track usage patterns for ML-based suggestions
    console.log(`Tracking quick reply usage: ${replyText} by ${userId} as ${context}`)

    // Store in user preferences or analytics table
    // This data can be used to improve quick reply suggestions
  } catch (error) {
    console.error('Failed to track quick reply usage:', error)
  }
}

/**
 * Smart text completion for message input
 */
export function getTextSuggestions(
  partialText: string,
  context: 'buyer' | 'seller'
): string[] {
  const suggestions: Record<string, string[]> = {
    'when': [
      'When can I see the vehicle?',
      'When is the best time to call?',
      'When was it last serviced?'
    ],
    'how': [
      'How many kilometers has it done?',
      'How is the engine condition?',
      'How long have you owned it?'
    ],
    'is': [
      'Is this still available?',
      'Is the price negotiable?',
      'Is it accident-free?'
    ],
    'can': [
      'Can I inspect it today?',
      'Can you provide more photos?',
      'Can we arrange a test drive?'
    ]
  }

  const firstWord = partialText.toLowerCase().split(' ')[0]
  return suggestions[firstWord] || []
}
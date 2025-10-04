/**
 * Smart Quick Reply System
 * Provides contextual quick replies for messaging
 */

export function getContextualQuickReplies(
  messages: any[],
  userRole: 'buyer' | 'seller'
): string[] {
  // Basic quick replies based on user role
  if (userRole === 'buyer') {
    return [
      "Is this still available?",
      "Can you negotiate on the price?",
      "Can I see the vehicle?"
    ]
  } else {
    return [
      "Yes, it's still available",
      "The price is negotiable",
      "You can view it anytime"
    ]
  }
}
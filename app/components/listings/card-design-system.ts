/**
 * Unified design system for listing cards
 * Eliminates duplication across 6+ card components
 */

export const CARD_CONSTANTS = {
  // Image heights (Tailwind classes)
  imageHeight: {
    featured: 'h-56 sm:h-64',
    promoted: 'h-48 sm:h-52',
    regular: 'h-44 sm:h-48',
  },

  // Shadow depths
  shadow: {
    featured: 'shadow-xl hover:shadow-2xl',
    topSpot: 'shadow-lg hover:shadow-xl',
    boosted: 'shadow-md hover:shadow-lg',
    urgent: 'shadow-lg hover:shadow-xl',
    regular: 'shadow-sm hover:shadow-md',
  },

  // Border widths and colors
  border: {
    featured: 'border-2 border-yellow-400 hover:border-yellow-500',
    topSpot: 'border-2 border-purple-300 hover:border-purple-400',
    boosted: 'border-2 border-blue-300 hover:border-blue-400',
    urgent: 'border-2 border-red-300 hover:border-red-400',
    regular: 'border border-gray-200 hover:border-gray-300',
  },

  // Background gradients
  background: {
    featured: 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50',
    topSpot: 'bg-gradient-to-br from-purple-50 via-white to-purple-50',
    boosted: 'bg-gradient-to-br from-blue-50 via-white to-cyan-50',
    urgent: 'bg-gradient-to-br from-red-50 via-white to-red-50',
    regular: 'bg-white',
  },

  // Content padding
  padding: {
    featured: 'p-4 sm:p-5 lg:p-6',
    promoted: 'p-3 sm:p-4',
    regular: 'p-3 sm:p-4',
  },

  // Hover transforms
  transform: {
    featured: 'hover:-translate-y-1',
    promoted: 'hover:-translate-y-0.5',
    regular: 'hover:scale-[1.01]',
  },

  // Title sizes
  titleSize: {
    featured: 'text-xl sm:text-2xl',
    topSpot: 'text-lg sm:text-xl',
    boosted: 'text-base sm:text-lg',
    urgent: 'text-lg sm:text-xl',
    regular: 'text-base sm:text-lg',
  },

  // Price sizes
  priceSize: {
    featured: 'text-2xl sm:text-3xl',
    topSpot: 'text-xl sm:text-2xl',
    boosted: 'text-lg sm:text-xl',
    urgent: 'text-xl sm:text-2xl',
    regular: 'text-lg sm:text-xl',
  },

  // Badge positioning
  badgePosition: {
    left: 'top-3 left-3 sm:top-4 sm:left-4',
    right: 'top-3 right-3 sm:top-4 sm:right-4',
  },

  // Overlay gradients
  overlay: {
    featured: 'from-yellow-100/10 via-transparent to-amber-100/10',
    topSpot: 'from-purple-100/10 via-transparent to-violet-100/10',
    boosted: 'from-blue-100/10 via-transparent to-cyan-100/10',
    urgent: 'from-red-100/20 via-transparent to-red-100/20',
  },
} as const

export const PROMOTION_COLORS = {
  featured: {
    badge: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    text: 'text-yellow-700',
    hover: 'hover:text-yellow-800',
    button: 'bg-yellow-600 hover:bg-yellow-700',
    buttonOutline: 'border-yellow-600 text-yellow-700 hover:bg-yellow-50',
    icon: 'text-yellow-500',
  },
  topSpot: {
    badge: 'bg-gradient-to-r from-purple-500 to-purple-600',
    text: 'text-purple-700',
    hover: 'hover:text-purple-800',
    button: 'bg-purple-600 hover:bg-purple-700',
    buttonOutline: 'border-purple-600 text-purple-700 hover:bg-purple-50',
    icon: 'text-purple-500',
  },
  boosted: {
    badge: 'bg-gradient-to-r from-blue-500 to-blue-600',
    text: 'text-blue-700',
    hover: 'hover:text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonOutline: 'border-blue-600 text-blue-700 hover:bg-blue-50',
    icon: 'text-blue-500',
  },
  urgent: {
    badge: 'bg-gradient-to-r from-red-600 to-red-700',
    text: 'text-red-700',
    hover: 'hover:text-red-800',
    button: 'bg-red-600 hover:bg-red-700',
    buttonOutline: 'border-red-600 text-red-700 hover:bg-red-50',
    icon: 'text-red-500',
  },
} as const

// Mobile-optimized grid configurations
export const GRID_LAYOUTS = {
  featured: 'grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2',
  promoted: 'grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  regular: 'grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2',
} as const

// Section wrapper styles
export const SECTION_STYLES = {
  featured: 'rounded-lg sm:rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4',
  topSpot: 'rounded-lg sm:rounded-xl border border-purple-200 bg-purple-50 p-3 sm:p-4',
  boosted: 'rounded-lg sm:rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4',
  urgent: 'rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4',
  regular: 'rounded-lg sm:rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:p-6',
} as const

/**
 * Generate complete card className
 */
export function getCardClasses(type: 'featured' | 'topSpot' | 'boosted' | 'urgent' | 'regular'): string {
  const baseClasses = 'relative rounded-lg overflow-hidden transition-all duration-300 group cursor-pointer'

  const typeMap = {
    featured: [
      baseClasses,
      CARD_CONSTANTS.background.featured,
      CARD_CONSTANTS.border.featured,
      CARD_CONSTANTS.shadow.featured,
      CARD_CONSTANTS.transform.featured,
    ],
    topSpot: [
      baseClasses,
      CARD_CONSTANTS.background.topSpot,
      CARD_CONSTANTS.border.topSpot,
      CARD_CONSTANTS.shadow.topSpot,
      CARD_CONSTANTS.transform.promoted,
    ],
    boosted: [
      baseClasses,
      CARD_CONSTANTS.background.boosted,
      CARD_CONSTANTS.border.boosted,
      CARD_CONSTANTS.shadow.boosted,
      CARD_CONSTANTS.transform.promoted,
    ],
    urgent: [
      baseClasses,
      CARD_CONSTANTS.background.urgent,
      CARD_CONSTANTS.border.urgent,
      CARD_CONSTANTS.shadow.urgent,
      CARD_CONSTANTS.transform.promoted,
    ],
    regular: [
      baseClasses,
      CARD_CONSTANTS.background.regular,
      CARD_CONSTANTS.border.regular,
      CARD_CONSTANTS.shadow.regular,
      CARD_CONSTANTS.transform.regular,
    ],
  }

  return typeMap[type].join(' ')
}

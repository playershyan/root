'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BuyingGuide {
  make: string
  model: string
  year?: number
  generation?: string
  compact: string
  detailed: string
}

interface BuyingGuideCardProps {
  guide: BuyingGuide
  onDismiss?: () => void
}

export default function BuyingGuideCard({ guide, onDismiss }: BuyingGuideCardProps) {
  const [showDetailed, setShowDetailed] = useState(false)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 md:p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                AI Buying Guide
              </h3>
              <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                {guide.make} {guide.model}
              </span>
            </div>
            {guide.generation && (
              <p className="text-xs text-gray-600 mt-0.5">
                {guide.generation} Generation
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss guide"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Compact Content */}
      <div
        className="prose prose-sm max-w-none text-gray-700 mb-4"
        dangerouslySetInnerHTML={{ __html: guide.compact }}
      />

      {/* Detailed Content (Expandable) */}
      {showDetailed && (
        <div
          className="prose prose-sm max-w-none text-gray-700 border-t border-blue-200 pt-4 mt-4"
          dangerouslySetInnerHTML={{ __html: guide.detailed }}
        />
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setShowDetailed(!showDetailed)}
        variant="outline"
        size="sm"
        className="w-full mt-4 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        {showDetailed ? (
          <>
            Show Less
            <ChevronUp className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            View Full Buying Guide
            <ChevronDown className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {/* Footer Note */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        AI-generated guidance for informational purposes. Always verify independently.
      </p>
    </div>
  )
}

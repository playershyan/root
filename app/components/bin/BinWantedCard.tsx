'use client'

import { useState } from 'react'
import { Search, RotateCcw, MapPin, Calendar, MessageCircle, User } from 'lucide-react'
import {
  BinItemData,
  formatDeletedDate,
  getDeletionUrgencyColor,
  getDeletionUrgencyMessage,
  formatPrice,
  truncateText
} from '@/lib/utils/binUtils'
import { Button } from '@/components/ui/button'

interface BinWantedCardProps {
  wanted: BinItemData
  onRestore?: (id: string) => void
  restoring?: boolean
}

export default function BinWantedCard({
  wanted,
  onRestore,
  restoring = false
}: BinWantedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleRestore = () => {
    if (onRestore && wanted.can_restore) {
      onRestore(wanted.id)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-orange-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
              {wanted.title}
            </h4>
            
            {/* Budget */}
            {wanted.budget && (
              <div className="mb-2">
                <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                  Budget: {formatPrice(wanted.budget)}
                </span>
              </div>
            )}
            
            {/* Description */}
            {wanted.description && (
              <p className="text-sm text-gray-600 mb-2">
                {isExpanded ? wanted.description : truncateText(wanted.description, 100)}
                {wanted.description.length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1 text-blue-600 hover:text-blue-700 font-medium min-h-touch active:scale-95 transition-transform inline-flex items-center"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            )}
            
            {/* Response count */}
            {wanted.responses !== undefined && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                  <MessageCircle className="w-3 h-3" />
                  {wanted.responses} response{wanted.responses !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Restore button */}
        <div className="flex-shrink-0 ml-3">
          {wanted.can_restore ? (
            <Button
              onClick={handleRestore}
              disabled={restoring}
              variant="success"
              size="sm"
              className="h-12"
            >
              {restoring ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </>
              )}
            </Button>
          ) : (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-3 rounded-lg inline-block min-h-touch">
              Cannot Restore
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2 text-sm text-gray-600">
        {wanted.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{wanted.location}</span>
          </div>
        )}
        
        {wanted.seller && (
          <div className="flex items-center gap-1">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">By {wanted.seller}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Deleted {formatDeletedDate(wanted.deleted_at)}</span>
        </div>
        
        {wanted.deletion_reason && (
          <div className="flex items-start gap-1">
            <span className="flex-shrink-0">Reason:</span>
            <span className="font-medium">{wanted.deletion_reason}</span>
          </div>
        )}
      </div>

      {/* Deletion countdown */}
      {wanted.can_restore && wanted.days_until_permanent_deletion > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getDeletionUrgencyColor(wanted.days_until_permanent_deletion)}`}>
            <span>{getDeletionUrgencyMessage(wanted.days_until_permanent_deletion)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
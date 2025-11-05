'use client'

import { useState } from 'react'
import { MessageSquare, RotateCcw, User, Calendar } from 'lucide-react'
import {
  BinItemData,
  formatDeletedDate,
  getDeletionUrgencyColor,
  getDeletionUrgencyMessage,
  truncateText
} from '@/lib/utils/binUtils'
import { Button } from '@/components/ui/button'

interface BinMessageCardProps {
  message: BinItemData
  onRestore?: (id: string) => void
  restoring?: boolean
}

export default function BinMessageCard({
  message,
  onRestore,
  restoring = false
}: BinMessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleRestore = () => {
    if (onRestore && message.can_restore) {
      onRestore(message.id)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
              {message.title}
            </h4>
            
            {/* Conversation info */}
            {message.conversation_with && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Conversation with {message.conversation_with}</span>
              </div>
            )}
            
            {/* Last message preview */}
            {message.last_message && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {isExpanded ? message.last_message : truncateText(message.last_message, 80)}
                {message.last_message.length > 80 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="ml-1 text-blue-600 hover:text-blue-700 font-medium min-h-touch active:scale-95 transition-transform inline-flex items-center"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Restore button */}
        <div className="flex-shrink-0 ml-3">
          {message.can_restore ? (
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
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span>Deleted {formatDeletedDate(message.deleted_at)}</span>
        </div>
        
        {message.deletion_reason && (
          <div className="flex items-start gap-1">
            <span className="flex-shrink-0">Reason:</span>
            <span className="font-medium">{message.deletion_reason}</span>
          </div>
        )}
      </div>

      {/* Deletion countdown */}
      {message.can_restore && message.days_until_permanent_deletion > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getDeletionUrgencyColor(message.days_until_permanent_deletion)}`}>
            <span>{getDeletionUrgencyMessage(message.days_until_permanent_deletion)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
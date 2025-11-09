'use client'

import { useState } from 'react'
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface OfferCardProps {
  offerId: string
  amount: number
  message?: string
  senderName: string
  timestamp: string
  isOwner: boolean // true if current user is the listing owner
  reaction?: 'accepted' | 'declined' | null
  onReaction?: (offerId: string, reaction: 'accepted' | 'declined') => Promise<void>
  listingTitle?: string
}

export default function OfferCard({
  offerId,
  amount,
  message,
  senderName,
  timestamp,
  isOwner,
  reaction,
  onReaction,
  listingTitle
}: OfferCardProps) {
  const [reacting, setReacting] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleReaction = async (reactionType: 'accepted' | 'declined') => {
    if (!onReaction || reacting || reaction) return

    setReacting(reactionType)
    try {
      await onReaction(offerId, reactionType)
    } catch (error) {
      logger.error('Error reacting to offer', error as Error, {
        component: 'OfferCard',
        action: 'handleReaction'
      })
    } finally {
      setReacting(null)
    }
  }

  // SVG for thumbs up
  const ThumbsUpSVG = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.334a2 2 0 001.106 1.789L8.5 18.75a1.5 1.5 0 001.5-1.5v-2.25a1 1 0 00-1-1H7.5a1 1 0 01-1-1zM13 6.75a1 1 0 011-1h3.5a1 1 0 011 1v2.5a1 1 0 01-1 1H14a1 1 0 01-1-1v-2.5z"/>
      <path d="M15 6.75V8a1 1 0 001 1h2.25a1 1 0 001-1V6.75a1 1 0 00-1-1H16a1 1 0 00-1 1z"/>
    </svg>
  )

  // SVG for thumbs down
  const ThumbsDownSVG = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.334a2 2 0 00-1.106-1.789L11.5 1.25A1.5 1.5 0 0010 2.75v2.25a1 1 0 001 1h1.5a1 1 0 011 1zM7 13.25a1 1 0 01-1 1H2.5a1 1 0 01-1-1v-2.5a1 1 0 011-1H6a1 1 0 011 1v2.5z"/>
      <path d="M5 13.25V12a1 1 0 00-1-1H1.75a1 1 0 00-1 1v1.25a1 1 0 001 1H4a1 1 0 001-1z"/>
    </svg>
  )

  return (
    <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-4 my-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Offer from {senderName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(timestamp)}
            </p>
          </div>
        </div>
      </div>

      {/* Offer Amount */}
      <div className="mb-3 p-3 bg-green-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Offer Amount</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(amount)}</p>
        </div>
      </div>

      {/* Listing Title */}
      {listingTitle && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-center">
          <p className="text-xs text-gray-600 mb-1">For listing:</p>
          <p className="text-sm font-medium text-gray-900 line-clamp-2">{listingTitle}</p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
      )}

      {/* Reaction Status or Buttons */}
      <div className="border-t pt-3">
        {reaction ? (
          /* Show reaction status */
          <div className="flex items-center justify-center gap-2 py-2">
            {reaction === 'accepted' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-medium text-sm">Offer Accepted</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-600 font-medium text-sm">Offer Declined</span>
              </>
            )}
          </div>
        ) : isOwner ? (
          /* Show reaction buttons for owner */
          <div className="flex gap-3">
            <button
              onClick={() => handleReaction('accepted')}
              disabled={!!reacting}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              <ThumbsUpSVG />
              <span className="text-sm font-medium">
                {reacting === 'accepted' ? 'Accepting...' : 'Accept'}
              </span>
            </button>
            <button
              onClick={() => handleReaction('declined')}
              disabled={!!reacting}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              <ThumbsDownSVG />
              <span className="text-sm font-medium">
                {reacting === 'declined' ? 'Declining...' : 'Decline'}
              </span>
            </button>
          </div>
        ) : (
          /* Show pending status for sender */
          <div className="flex items-center justify-center gap-2 py-2 text-orange-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Awaiting Response</span>
          </div>
        )}
      </div>
    </div>
  )
}
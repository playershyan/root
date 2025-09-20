'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export interface MatchNotification {
  id: string
  listing_id: string
  wanted_request_ids: string[]
  match_count: number
  listing_make: string
  listing_model: string
  listing_year: number
  listing_price: number
  created_at: string
  dismissed_at?: string
}

interface MatchNotificationBannerProps {
  notification: MatchNotification
  onDismiss: (notificationId: string) => Promise<void>
}

export default function MatchNotificationBanner({
  notification,
  onDismiss,
}: MatchNotificationBannerProps) {
  const [isDismissing, setIsDismissing] = useState(false)

  const handleDismiss = async () => {
    setIsDismissing(true)
    try {
      await onDismiss(notification.id)
    } catch (error) {
      console.error('Error dismissing notification:', error)
      setIsDismissing(false)
    }
  }

  // Generate search URL with matching criteria (using asymmetric tolerance)
  const generateSearchUrl = () => {
    const params = new URLSearchParams({
      make: notification.listing_make,
      model: notification.listing_model,
      minYear: (notification.listing_year - 3).toString(),
      maxYear: (notification.listing_year + 3).toString(),
      minPrice: Math.floor(notification.listing_price * 0.85).toString(),  // 15% below
      maxPrice: Math.ceil(notification.listing_price * 1.25).toString(),   // 25% above
    })

    return `/wanted/search?${params.toString()}`
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Format the notification text
  const getNotificationText = () => {
    const count = notification.match_count
    const vehicle = `${notification.listing_year} ${notification.listing_make} ${notification.listing_model}`

    if (count === 1) {
      return `1 person is looking for a ${vehicle}`
    } else {
      return `${count} people are looking for a ${vehicle}`
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-blue-800 font-medium">
              {getNotificationText()} -{' '}
              <Link
                href={generateSearchUrl()}
                className="text-blue-600 underline hover:text-blue-800 transition-colors"
              >
                check out here
              </Link>
            </p>
          </div>

          <div className="mt-2 text-sm text-blue-600">
            <p>
              Looking for vehicles around{' '}
              <span className="font-medium">{formatPrice(notification.listing_price)}</span>
              {' '}(±25%) from years{' '}
              <span className="font-medium">
                {notification.listing_year - 3} - {notification.listing_year + 3}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          disabled={isDismissing}
          className="ml-4 p-1 text-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          aria-label="Dismiss notification"
        >
          {isDismissing ? (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Additional details for larger screens */}
      <div className="hidden md:block mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-blue-600 space-y-1">
          <p>
            <span className="font-medium">Vehicle Match:</span>{' '}
            {notification.listing_make} {notification.listing_model} ({notification.listing_year})
          </p>
          <p>
            <span className="font-medium">Price Range:</span>{' '}
            {formatPrice(notification.listing_price * 0.85)} -{' '}
            {formatPrice(notification.listing_price * 1.25)}
          </p>
          <p>
            <span className="font-medium">Posted:</span>{' '}
            {new Date(notification.created_at).toLocaleDateString('en-LK', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

// Multi-notification banner for when there are multiple notifications
interface MultiMatchNotificationBannerProps {
  notifications: MatchNotification[]
  onDismissAll: () => Promise<void>
  onDismiss: (notificationId: string) => Promise<void>
}

export function MultiMatchNotificationBanner({
  notifications,
  onDismissAll,
  onDismiss,
}: MultiMatchNotificationBannerProps) {
  const [isDismissingAll, setIsDismissingAll] = useState(false)

  const handleDismissAll = async () => {
    setIsDismissingAll(true)
    try {
      await onDismissAll()
    } catch (error) {
      console.error('Error dismissing all notifications:', error)
      setIsDismissingAll(false)
    }
  }

  const totalMatches = notifications.reduce((sum, n) => sum + n.match_count, 0)

  if (notifications.length <= 1) {
    return notifications.length === 1 ? (
      <MatchNotificationBanner
        notification={notifications[0]}
        onDismiss={onDismiss}
      />
    ) : null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 relative">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-blue-800 font-medium">
              {totalMatches} people are looking for {notifications.length} different vehicles that were recently approved
            </p>
          </div>

          <div className="mt-3 space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between bg-white rounded p-2 border border-blue-100">
                <div className="flex-1">
                  <span className="text-sm text-blue-700">
                    {notification.match_count} {notification.match_count === 1 ? 'person' : 'people'} looking for{' '}
                    <span className="font-medium">
                      {notification.listing_year} {notification.listing_make} {notification.listing_model}
                    </span>
                  </span>
                  <div className="text-xs text-blue-600 mt-1">
                    <Link
                      href={`/wanted/search?make=${notification.listing_make}&model=${notification.listing_model}&minYear=${notification.listing_year - 3}&maxYear=${notification.listing_year + 3}&minPrice=${Math.floor(notification.listing_price * 0.85)}&maxPrice=${Math.ceil(notification.listing_price * 1.25)}`}
                      className="underline hover:text-blue-800 transition-colors"
                    >
                      View matching requests
                    </Link>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="ml-2 p-1 text-blue-400 hover:text-blue-600 transition-colors"
                  aria-label="Dismiss this notification"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {notifications.length > 3 && (
              <p className="text-sm text-blue-600 italic">
                ... and {notifications.length - 3} more vehicle matches
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleDismissAll}
          disabled={isDismissingAll}
          className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
          aria-label="Dismiss all notifications"
        >
          {isDismissingAll ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Dismissing...</span>
            </div>
          ) : (
            'Dismiss All'
          )}
        </button>
      </div>
    </div>
  )
}
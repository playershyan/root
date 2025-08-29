'use client'

import Link from 'next/link'
import { Phone, MessageSquare, MessageCircle, MapPin, Star, User } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatPhoneDisplay, formatPhoneForWhatsApp, formatPhoneForTel } from '@/lib/utils/phoneFormatter'

// Types
type ContactProfileProps = {
  listing: {
    id?: string // Add listing ID for messaging
    phone: string
    whatsapp?: string | null
    email?: string | null
    location: string
    seller_type?: 'dealer' | 'private' // Add this field to determine profile type
    seller_name?: string // Name of seller (dealer name or private seller name)
    user_id?: string // Add seller user ID for messaging
  }
  dealer?: {
    name: string
    rating: number
    reviewCount: number
    location: string
    phone: string
    whatsapp: string
    avatar: string | null
  }
}

// Dealer Profile Component
function DealerProfile({ dealer, listing }: { 
  dealer: ContactProfileProps['dealer'], 
  listing: ContactProfileProps['listing']
}) {
  if (!dealer) return null

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Contact Dealer</h2>
      
      {/* Dealer Profile */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
          {dealer.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <Link 
            href={`/dealers/${encodeURIComponent(dealer.name.toLowerCase().replace(/\s+/g, '-'))}`}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            {dealer.name}
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(dealer.rating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="text-gray-600">
              {dealer.rating} ({dealer.reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        <MapPin className="inline w-4 h-4 mr-1" />
        {dealer.location}
      </p>

      {/* Contact Actions */}
      <div className="space-y-3">
        <a
          href={formatPhoneForTel(dealer.phone)}
          className="btn-call btn-full btn-icon"
        >
          <Phone className="w-4 h-4" />
          Call {formatPhoneDisplay(dealer.phone)}
        </a>
        <MessageButton listing={listing} />
        <a
          href={`https://wa.me/${formatPhoneForWhatsApp(dealer.whatsapp)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp btn-full btn-icon"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}

// Private Seller Profile Component
function PrivateSellerProfile({ listing }: { 
  listing: ContactProfileProps['listing']
}) {
  const sellerName = listing.seller_name || 'Private Seller'

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Contact Seller</h2>
      
      {/* Private Seller Profile */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="w-12 h-12 bg-gray-500 text-white rounded-full flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">Ad posted by</p>
          <p className="font-semibold text-gray-900">{sellerName}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        <MapPin className="inline w-4 h-4 mr-1" />
        {listing.location}
      </p>

      {/* Contact Actions - Simplified for private sellers */}
      <div className="space-y-3">
        <a
          href={formatPhoneForTel(listing.phone)}
          className="btn-call btn-full btn-icon"
        >
          <Phone className="w-4 h-4" />
          Call {formatPhoneDisplay(listing.phone)}
        </a>
        <MessageButton listing={listing} />
        <a
          href={`https://wa.me/${formatPhoneForWhatsApp(listing.whatsapp || listing.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp btn-full btn-icon"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>
    </div>
  )
}

// Message Button Component
function MessageButton({ listing }: { listing: ContactProfileProps['listing'] }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleMessage = async () => {
    if (!listing.id || !listing.user_id) {
      alert('Unable to send message. Listing information is missing.')
      return
    }

    setLoading(true)
    
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Create or get conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          seller_id: listing.user_id
        })
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.error === 'Cannot message yourself') {
          alert('You cannot send messages to your own listing.')
          return
        }
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      router.push(`/profile?tab=messages&conversation=${data.conversation_id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleMessage}
      disabled={loading}
      className="btn-message btn-full btn-icon disabled:opacity-50"
    >
      <MessageSquare className="w-4 h-4" />
      {loading ? 'Loading...' : 'Message'}
    </button>
  )
}

// Main ContactProfile Component
export default function ContactProfile({ listing, dealer }: ContactProfileProps) {
  // Determine profile type - if seller_type is explicitly set, use that
  // Otherwise, fallback to checking if dealer object exists (for backward compatibility)
  const isDealer = listing.seller_type === 'dealer' || (listing.seller_type === undefined && dealer !== undefined)

  if (isDealer && dealer) {
    return <DealerProfile dealer={dealer} listing={listing} />
  } else {
    return <PrivateSellerProfile listing={listing} />
  }
}
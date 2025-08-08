'use client'

import { Phone, MessageSquare, MessageCircle, MapPin, Star, User } from 'lucide-react'

// Types
type ContactProfileProps = {
  listing: {
    phone: string
    whatsapp?: string | null
    email?: string | null
    location: string
    seller_type?: 'dealer' | 'private' // Add this field to determine profile type
    seller_name?: string // Name of seller (dealer name or private seller name)
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
function DealerProfile({ dealer, listing, formatPhoneNumber }: { 
  dealer: ContactProfileProps['dealer'], 
  listing: ContactProfileProps['listing'],
  formatPhoneNumber: (phone: string) => string 
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
          <p className="font-semibold">{dealer.name}</p>
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
          href={`tel:${dealer.phone}`}
          className="btn-call btn-full btn-icon"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
        <button className="btn-message btn-full btn-icon">
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
        <a
          href={`https://wa.me/${formatPhoneNumber(dealer.whatsapp)}`}
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
function PrivateSellerProfile({ listing, formatPhoneNumber }: { 
  listing: ContactProfileProps['listing'],
  formatPhoneNumber: (phone: string) => string 
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
          href={`tel:${listing.phone}`}
          className="btn-call btn-full btn-icon"
        >
          <Phone className="w-4 h-4" />
          Call
        </a>
        <button className="btn-message btn-full btn-icon">
          <MessageSquare className="w-4 h-4" />
          Message
        </button>
        <a
          href={`https://wa.me/${formatPhoneNumber(listing.whatsapp || listing.phone)}`}
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

// Main ContactProfile Component
export default function ContactProfile({ listing, dealer }: ContactProfileProps) {
  const formatPhoneNumber = (phone: string) => {
    // Format phone for WhatsApp (remove spaces and add country code if needed)
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.startsWith('94') ? cleaned : `94${cleaned.startsWith('0') ? cleaned.slice(1) : cleaned}`
  }

  // Determine profile type - if seller_type is explicitly set, use that
  // Otherwise, fallback to checking if dealer object exists (for backward compatibility)
  const isDealer = listing.seller_type === 'dealer' || (listing.seller_type === undefined && dealer !== undefined)

  if (isDealer && dealer) {
    return <DealerProfile dealer={dealer} listing={listing} formatPhoneNumber={formatPhoneNumber} />
  } else {
    return <PrivateSellerProfile listing={listing} formatPhoneNumber={formatPhoneNumber} />
  }
}
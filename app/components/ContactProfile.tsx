'use client'

import Link from 'next/link'
import { Phone, MessageSquare, MessageCircle, User, Building2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatPhoneDisplay, formatPhoneForWhatsApp, formatPhoneForTel } from '@/lib/utils/phoneFormatter'
import ContactModal from '@/app/components/modals/ContactModal'

// Types
type Listing = {
  id?: string
  phone: string
  whatsapp?: string | null
  email?: string | null
  location: string
  user_id?: string
}

type BusinessSellerData = {
  type: 'business'
  businessId: string
  name: string
  description?: string
  businessType?: string
  website?: string
  address?: string
  businessPhone?: string
  operatingHours?: string
  isVerified?: boolean
  logoUrl?: string
  bannerUrl?: string
  profileImageUrl?: string
  location: string
  phone: string
  whatsapp: string
  email?: string | null
  avatar?: string | null
  rating: number
  reviewCount: number
}

type IndividualSellerData = {
  type: 'individual'
  name: string
  location: string
  phone: string
  whatsapp: string
  email?: string | null
  avatar?: string | null
  bio?: string
}

type SellerData = BusinessSellerData | IndividualSellerData | null

type ContactProfileProps = {
  listing: Listing
  sellerData: SellerData
  onMessageClick?: () => void
  // Legacy props for backward compatibility
  dealer?: any
}

// Business Profile Component
function BusinessProfile({ seller, listing, onMessageClick }: { 
  seller: BusinessSellerData, 
  listing: Listing,
  onMessageClick?: () => void
}) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Banner Image */}
      {seller.bannerUrl && (
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800">
          <img 
            src={seller.bannerUrl} 
            alt={`${seller.name} banner`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Dealer</h2>
        
        {/* Business Profile */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
            {seller.profileImageUrl || seller.logoUrl ? (
              <img 
                src={seller.profileImageUrl || seller.logoUrl} 
                alt={seller.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 border border-blue-200 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Link 
              href={`/business/${seller.businessId}`}
              className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              {seller.name}
              {seller.isVerified && (
                <span title="Verified Business">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="space-y-3">
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="btn-call btn-full btn-icon"
          >
            <Phone className="w-4 h-4" />
            Contact
          </button>
          <MessageButton listing={listing} onMessageClick={onMessageClick} />
        </div>
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        listing={{
          id: listing.id || '',
          title: seller.name,
          phone: seller.phone,
          whatsapp: seller.whatsapp,
          price: 0,
          location: seller.location,
          make: '',
          model: '',
          year: undefined
        }}
      />
    </div>
  )
}

// Individual Profile Component
function IndividualProfile({ seller, listing, onMessageClick }: {
  seller: IndividualSellerData,
  listing: Listing,
  onMessageClick?: () => void
}) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Contact Seller</h2>
      
      {/* Individual Profile */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center font-medium text-sm">
          <span>
            {seller.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-lg">{seller.name}</p>
        </div>
      </div>

      {/* Contact Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setIsContactModalOpen(true)}
          className="btn-call btn-full btn-icon"
        >
          <Phone className="w-4 h-4" />
          Contact
        </button>
        <MessageButton listing={listing} onMessageClick={onMessageClick} />
      </div>

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        listing={{
          id: listing.id || '',
          title: seller.name,
          phone: seller.phone,
          whatsapp: seller.whatsapp,
          price: 0,
          location: seller.location,
          make: '',
          model: '',
          year: undefined
        }}
      />
    </div>
  )
}

// Message Button Component
function MessageButton({ listing, onMessageClick }: {
  listing: Listing
  onMessageClick?: () => void
}) {

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleMessage = async () => {
    // If onMessageClick prop is provided, use it instead of redirect
    if (onMessageClick) {
      onMessageClick()
      return
    }

    // Fallback to original redirect behavior
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
      const response = await fetch('/api/messaging/conversations', {
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
export default function ContactProfile({ listing, sellerData, dealer, onMessageClick }: ContactProfileProps) {
  // Use seller data if available, otherwise fall back to legacy dealer data
  if (sellerData) {
    if (sellerData.type === 'business') {
      return <BusinessProfile seller={sellerData} listing={listing} onMessageClick={onMessageClick} />
    } else {
      return <IndividualProfile seller={sellerData} listing={listing} onMessageClick={onMessageClick} />
    }
  }
  
  // Legacy fallback - if no seller data, use old dealer logic
  // This ensures backward compatibility with existing listings
  if (dealer) {
    const legacyBusinessSeller: BusinessSellerData = {
      type: 'business',
      businessId: '', // No ID for legacy dealers
      name: dealer.name,
      location: dealer.location,
      phone: dealer.phone,
      whatsapp: dealer.whatsapp,
      rating: dealer.rating,
      reviewCount: dealer.reviewCount,
      avatar: dealer.avatar
    }
    return <BusinessProfile seller={legacyBusinessSeller} listing={listing} onMessageClick={onMessageClick} />
  }
  
  // Fallback to basic individual profile
  const fallbackSeller: IndividualSellerData = {
    type: 'individual',
    name: 'Private Seller',
    location: listing.location,
    phone: listing.phone,
    whatsapp: listing.whatsapp || listing.phone
  }
  
  return <IndividualProfile seller={fallbackSeller} listing={listing} onMessageClick={onMessageClick} />
}
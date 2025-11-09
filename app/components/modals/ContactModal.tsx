'use client'

import { useState, useEffect } from 'react'
import { X, Phone, MessageCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    title: string
    phone?: string
    whatsapp?: string
    price: number
    location: string
    make?: string
    model?: string
    year?: number
  }
}

export default function ContactModal({ isOpen, onClose, listing }: ContactModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      logger.error('Failed to copy contact detail', err as Error, {
        component: 'ContactModal',
        action: 'handleCopy',
        field
      })
    }
  }

  const formatPhoneForDisplay = (phone: string) => {
    // Remove country code prefix for display
    if (phone.startsWith('94')) {
      return '0' + phone.substring(2)
    }
    return phone
  }

  const formatPhoneForDial = (phone: string) => {
    // Ensure country code format for dialing
    if (phone.startsWith('94')) {
      return '+' + phone
    }
    if (phone.startsWith('0')) {
      return '+94' + phone.substring(1)
    }
    return '+94' + phone
  }

  const handlePhoneClick = (phone: string) => {
    const dialNumber = formatPhoneForDial(phone)
    window.location.href = `tel:${dialNumber}`
  }

  const handleWhatsAppClick = (whatsapp: string) => {
    const whatsappNumber = formatPhoneForDial(whatsapp)
    const message = encodeURIComponent(`Hi! I'm interested in your ${listing.make} ${listing.model} ${listing.year} listed for Rs. ${listing.price.toLocaleString()}.`)
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Open WhatsApp app
      window.location.href = `whatsapp://send?phone=${whatsappNumber}&text=${message}`
    } else {
      // Open WhatsApp Web
      window.open(`https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="pr-10">
            <h2 className="text-lg font-bold">Contact Seller</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Contact Options */}
          <div className="space-y-3">
            
            {/* Phone */}
            {listing.phone && (
              <div className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                      <Phone className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-base font-mono text-gray-700">
                        {formatPhoneForDisplay(listing.phone)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCopy(formatPhoneForDisplay(listing.phone), 'phone')}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => handlePhoneClick(listing.phone!)}
                  size="default"
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
              </div>
            )}

            {/* WhatsApp */}
            {listing.whatsapp && (
              <div className="border border-gray-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                      <MessageCircle className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">WhatsApp</p>
                      <p className="text-base font-mono text-gray-700">
                        {formatPhoneForDisplay(listing.whatsapp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCopy(formatPhoneForDisplay(listing.whatsapp!), 'whatsapp')}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Copy WhatsApp number"
                  >
                    {copiedField === 'whatsapp' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => handleWhatsAppClick(listing.whatsapp!)}
                  size="default"
                  className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
                >
                  <i className="fab fa-whatsapp text-base" />
                  WhatsApp
                </Button>
              </div>
            )}

            {/* No contact info available */}
            {!listing.phone && !listing.whatsapp && (
              <div className="text-center py-4 text-gray-500">
                <i className="fas fa-phone-slash text-2xl mb-2"></i>
                <p className="text-sm">No contact information available for this listing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
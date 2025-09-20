'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Globe, Phone, Clock, MapPin, CheckCircle, Edit2, Save, X, Camera, Upload, Eye, ExternalLink, MessageCircle } from 'lucide-react'
import { BusinessProfile, UpdateBusinessProfileData } from '@/lib/types/businessProfile'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

interface BusinessPageTabProps {
  businessProfile: BusinessProfile
  onUpdate: (data: UpdateBusinessProfileData) => Promise<void>
  loading?: boolean
}

export default function BusinessPageTab({
  businessProfile,
  onUpdate,
  loading = false
}: BusinessPageTabProps) {
  const { toasts, showError, removeToast } = useToast()
  
  // Show loading state while business profile is being fetched
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          {/* Banner Skeleton */}
          <div className="bg-gray-300 h-64 rounded-t-lg"></div>
          
          {/* Profile Section Skeleton */}
          <div className="bg-white rounded-b-lg border-x border-b p-6">
            <div className="flex items-end gap-4 -mt-16">
              {/* Profile Image Skeleton */}
              <div className="w-32 h-32 bg-gray-300 rounded-full border-4 border-white"></div>
              
              {/* Business Info Skeleton */}
              <div className="flex-1 pb-4">
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            
            {/* Contact Info Skeleton */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const [isEditing, setIsEditing] = useState(false)
  const [sameAsPhone, setSameAsPhone] = useState(
    businessProfile.whatsapp === businessProfile.phone || (!businessProfile.whatsapp && !!businessProfile.phone)
  )
  const [formData, setFormData] = useState<UpdateBusinessProfileData>({
    business_name: businessProfile.business_name,
    description: businessProfile.description,
    website: businessProfile.website,
    address: businessProfile.address,
    phone: businessProfile.phone,
    whatsapp: businessProfile.whatsapp,
    operating_hours: businessProfile.operating_hours,
    logo_url: businessProfile.logo_url,
    banner_url: businessProfile.banner_url,
    profile_image_url: businessProfile.profile_image_url
  })

  const handleSave = async () => {
    await onUpdate(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      business_name: businessProfile.business_name,
      description: businessProfile.description,
      website: businessProfile.website,
      address: businessProfile.address,
      phone: businessProfile.phone,
      whatsapp: businessProfile.whatsapp,
      operating_hours: businessProfile.operating_hours,
      logo_url: businessProfile.logo_url,
      banner_url: businessProfile.banner_url,
      profile_image_url: businessProfile.profile_image_url
    })
    setSameAsPhone(
      businessProfile.whatsapp === businessProfile.phone || (!businessProfile.whatsapp && !!businessProfile.phone)
    )
    setIsEditing(false)
  }

  const handleImageUpload = (field: 'banner_url' | 'profile_image_url') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          showError('Image exceeds 10MB')
          return
        }

        // TODO: Upload file to storage and get URL
        // For now, just show placeholder
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setFormData({...formData, [field]: result})
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handlePhoneChange = (phone: string) => {
    setFormData({...formData, phone})
    // If "same as phone" is checked, update WhatsApp too
    if (sameAsPhone) {
      setFormData(prev => ({...prev, phone, whatsapp: phone}))
    }
  }

  const handleSameAsPhoneChange = (checked: boolean) => {
    setSameAsPhone(checked)
    if (checked) {
      // Set WhatsApp to be the same as phone
      setFormData(prev => ({...prev, whatsapp: prev.phone}))
    }
  }

  const handleWhatsAppChange = (whatsapp: string) => {
    setFormData({...formData, whatsapp})
    // If user manually changes WhatsApp and it's different from phone, uncheck the checkbox
    if (sameAsPhone && whatsapp !== formData.phone) {
      setSameAsPhone(false)
    }
  }

  if (!businessProfile.is_active) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Profile Paused</h3>
          <p className="text-gray-600 max-w-md">
            Your business profile is currently paused. Resume it from the My Profile tab to make it visible to customers again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Facebook-style Business Page Layout */}
      
      {/* Banner Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 h-64 rounded-t-lg overflow-hidden">
        {businessProfile.banner_url ? (
          <img 
            src={businessProfile.banner_url} 
            alt="Business Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-white">
              <Building2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-lg opacity-75">Add a banner image</p>
            </div>
          </div>
        )}
        
        {/* Banner Edit Button */}
        {isEditing && (
          <button
            onClick={() => handleImageUpload('banner_url')}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 p-2 rounded-lg transition-colors"
            title="Upload banner image (Max 10MB)"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="bg-white rounded-b-lg border-x border-b">
        {/* Profile Image and Basic Info */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-end gap-4 -mt-16">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white overflow-hidden shadow-lg">
                {businessProfile.profile_image_url ? (
                  <img 
                    src={businessProfile.profile_image_url} 
                    alt="Business Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Profile Image Edit Button */}
              {isEditing && (
                <button
                  onClick={() => handleImageUpload('profile_image_url')}
                  className="absolute bottom-2 right-2 bg-white hover:bg-gray-50 border text-gray-700 p-2 rounded-full shadow-md transition-colors"
                  title="Upload profile image (Max 10MB)"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3 mb-2">
                {!isEditing ? (
                  <h1 className="text-3xl font-bold text-gray-900">{businessProfile.business_name}</h1>
                ) : (
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    placeholder="enter business name"
                    className="text-3xl font-bold bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                    disabled={loading}
                  />
                )}
                
                {/* Verification Badge - Only show when data is loaded */}
                {businessProfile.is_verified !== undefined && (
                  businessProfile.is_verified ? (
                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Pending Verification
                    </div>
                  )
                )}
              </div>
              
              {!isEditing && (
                <p className="text-gray-700">{businessProfile.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <div className="mb-4 flex gap-2">
                <Link
                  href={`/business/${businessProfile.id}`}
                  target="_blank"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Page
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information & Edit Form */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-6">
          {!isEditing ? (
            <>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businessProfile.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a href={businessProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {businessProfile.website}
                    </a>
                  </div>
                </div>
              )}
              
              {businessProfile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{businessProfile.phone}</p>
                  </div>
                </div>
              )}

              {businessProfile.whatsapp && (
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="text-gray-900">{businessProfile.whatsapp}</p>
                  </div>
                </div>
              )}
              
              {businessProfile.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">{businessProfile.address}</p>
                  </div>
                </div>
              )}
              
              {businessProfile.operating_hours && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Operating Hours</p>
                    <p className="text-gray-900">{businessProfile.operating_hours}</p>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-4">Edit Business Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://yourbusiness.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+94 11 123 4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                
                {/* WhatsApp Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <div className="space-y-3">
                    <input
                      type="tel"
                      value={formData.whatsapp || ''}
                      onChange={(e) => handleWhatsAppChange(e.target.value)}
                      placeholder="+94 11 123 4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading || sameAsPhone}
                    />
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="same-as-phone"
                        checked={sameAsPhone}
                        onChange={(e) => handleSameAsPhoneChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={loading}
                      />
                      <label htmlFor="same-as-phone" className="ml-2 text-sm text-gray-600">
                        Same as phone number
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={formData.operating_hours || ''}
                      onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                      placeholder="e.g., Mon-Fri 9AM-6PM"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="Business address"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {/* Save/Cancel Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Business Statistics */}
      <div className="bg-white rounded-lg border mt-6 p-6">
        <h2 className="text-lg font-semibold mb-4">Business Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Active Listings</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Total Views</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Customer Inquiries</p>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
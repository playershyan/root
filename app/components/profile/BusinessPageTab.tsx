'use client'

import { useState } from 'react'
import { Building2, Globe, Phone, Clock, MapPin, CheckCircle, Edit2, Save, X } from 'lucide-react'
import { BusinessProfile, UpdateBusinessProfileData } from '@/lib/types/businessProfile'

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
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateBusinessProfileData>({
    business_name: businessProfile.business_name,
    business_type: businessProfile.business_type,
    description: businessProfile.description,
    website: businessProfile.website,
    address: businessProfile.address,
    phone: businessProfile.phone,
    operating_hours: businessProfile.operating_hours
  })

  const handleSave = async () => {
    await onUpdate(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      business_name: businessProfile.business_name,
      business_type: businessProfile.business_type,
      description: businessProfile.description,
      website: businessProfile.website,
      address: businessProfile.address,
      phone: businessProfile.phone,
      operating_hours: businessProfile.operating_hours
    })
    setIsEditing(false)
  }

  if (businessProfile.is_paused) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Business Profile</h1>
            <p className="text-gray-600">Manage your business information and public profile</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-2 mb-4">
          {businessProfile.is_verified ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-600 font-medium">Verified Business</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 border-2 border-yellow-600 rounded-full" />
              <span className="text-yellow-600 font-medium">Pending Verification</span>
            </>
          )}
        </div>
      </div>

      {/* Business Information */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Business Information</h2>
        
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Business Name</h3>
              <p className="text-gray-900">{businessProfile.business_name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Business Type</h3>
              <p className="text-gray-900">{businessProfile.business_type}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{businessProfile.description}</p>
            </div>
            
            {businessProfile.website && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Website</h3>
                <a href={businessProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {businessProfile.website}
                </a>
              </div>
            )}
            
            {businessProfile.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                <p className="text-gray-900 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {businessProfile.phone}
                </p>
              </div>
            )}
            
            {businessProfile.address && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                <p className="text-gray-900 flex items-start gap-1">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  {businessProfile.address}
                </p>
              </div>
            )}
            
            {businessProfile.operating_hours && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Operating Hours</h3>
                <p className="text-gray-900 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {businessProfile.operating_hours}
                </p>
              </div>
            )}
          </div>
        ) : (
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="Auto Dealer">Auto Dealer</option>
                <option value="Car Showroom">Car Showroom</option>
                <option value="Vehicle Importer">Vehicle Importer</option>
                <option value="Auto Parts">Auto Parts</option>
                <option value="Service Center">Service Center</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+94 11 123 4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address, city, postal code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours
              </label>
              <input
                type="text"
                value={formData.operating_hours || ''}
                onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-4PM"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
          </form>
        )}
      </div>

      {/* Business Statistics */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Business Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Active Listings</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Total Views</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Inquiries</p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Building2, Star, Globe, X } from 'lucide-react'
import { CreateBusinessProfileData } from '@/lib/types/businessProfile'

interface CreateBusinessProfileProps {
  onSubmit: (data: CreateBusinessProfileData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function CreateBusinessProfile({
  onSubmit,
  onCancel,
  loading = false
}: CreateBusinessProfileProps) {
  const [formData, setFormData] = useState<CreateBusinessProfileData>({
    business_name: '',
    business_type: 'Auto Dealer',
    description: '',
    website: '',
    address: '',
    phone: '',
    operating_hours: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Business description is required'
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Please enter a valid URL starting with http:// or https://'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    await onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Business Profile</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <div className="text-center mb-6">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Up Your Business Profile</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Create a professional presence for your dealership to build trust with customers and access advanced selling tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <Star className="w-8 h-8 text-blue-600 mb-3" />
                <h4 className="font-semibold text-blue-900 mb-2">Build Trust</h4>
                <p className="text-sm text-blue-700">
                  Verified business profile with contact information and operating hours
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <Globe className="w-8 h-8 text-green-600 mb-3" />
                <h4 className="font-semibold text-green-900 mb-2">Professional Presence</h4>
                <p className="text-sm text-green-700">
                  Dedicated dealer page with your branding and vehicle inventory
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  placeholder="e.g., City Motors, Premium Auto Sales"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.business_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.business_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
                )}
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
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://yourbusiness.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+94 11 123 4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address, city, postal code"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell customers about your business, services, and what makes you special..."
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours
              </label>
              <input
                type="text"
                value={formData.operating_hours}
                onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-4PM"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Business Profile'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
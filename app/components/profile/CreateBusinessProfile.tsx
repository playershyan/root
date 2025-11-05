'use client'

import { useState } from 'react'
import { Building2, Star, Globe, X } from 'lucide-react'
import { CreateBusinessProfileData } from '@/lib/types/businessProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
    description: '',
    website: '',
    address: '',
    phone: '',
    operating_hours: '',
    logo_url: '',
    banner_url: '',
    profile_image_url: ''
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
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <X className="w-5 h-5" />
          </Button>
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
                <Label htmlFor="business-name">
                  Business Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="business-name"
                  type="text"
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  placeholder="e.g., City Motors, Premium Auto Sales"
                  className={errors.business_name ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {errors.business_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
                )}
              </div>


              <div>
                <Label htmlFor="website">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  inputMode="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://yourbusiness.com"
                  className={errors.website ? 'border-red-300' : ''}
                  disabled={loading}
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">
                  Business Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+94 11 123 4567"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">
                Business Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address, city, postal code"
                rows={3}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">
                Business Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Tell customers about your business, services, and what makes you special..."
                className={errors.description ? 'border-red-300' : ''}
                rows={4}
                disabled={loading}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <Label htmlFor="operating-hours">
                Operating Hours
              </Label>
              <Input
                id="operating-hours"
                type="text"
                value={formData.operating_hours}
                onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                placeholder="e.g., Mon-Fri 9AM-6PM, Sat 9AM-4PM"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Business Profile'}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
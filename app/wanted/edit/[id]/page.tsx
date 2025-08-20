'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  DISTRICTS, 
  getCitiesByDistrictId,
  getDistrictByName 
} from '@/lib/constants/locations'
import { useAuth } from '@/app/contexts/AuthContext'

const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 
  'Mitsubishi', 'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz',
  'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Isuzu',
  'Daihatsu', 'Subaru', 'Lexus', 'Peugeot', 'Land Rover'
]

const MAKE_MODEL_MAP: Record<string, string[]> = {
  toyota: ['Prius', 'Camry', 'Corolla', 'Vitz', 'Aqua', 'CHR', 'Highlander', 'Land Cruiser', 'Land Cruiser Prado', 'Hiace', 'Hilux', 'RAV4', 'Fortuner'],
  honda: ['Civic', 'Accord', 'Fit', 'Vezel', 'CR-V', 'Insight', 'City', 'Jazz', 'Pilot', 'HR-V', 'BR-V', 'Freed'],
  nissan: ['March', 'Tiida', 'Sylphy', 'Teana', 'X-Trail', 'Murano', 'Navara', 'Juke', 'Qashqai', 'Leaf', 'Note', 'Serena'],
  mazda: ['Demio', 'Axela', 'Atenza', 'CX-3', 'CX-5', 'CX-9', 'BT-50', 'Premacy', 'Biante', 'Roadster'],
  suzuki: ['Alto', 'Swift', 'Wagon R', 'Baleno', 'Vitara', 'Jimny', 'Ertiga', 'S-Cross', 'Ignis', 'Ciaz'],
  mitsubishi: ['Lancer', 'Outlander', 'Pajero', 'Montero', 'ASX', 'Mirage', 'Triton', 'Galant', 'Colt', 'Eclipse'],
  hyundai: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'i10', 'i20', 'i30', 'Accent', 'Genesis', 'Kona'],
  kia: ['Cerato', 'Optima', 'Sportage', 'Sorento', 'Picanto', 'Rio', 'Soul', 'Stinger', 'Carnival', 'Seltos'],
  bmw: ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8'],
  'mercedes-benz': ['C-Class', 'E-Class', 'S-Class', 'A-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'CLA', 'CLS']
}

interface FormData {
  title: string
  description: string
  min_budget: string
  max_budget: string
  make: string
  model: string
  min_year: string
  max_year: string
  location: string
  phone: string
  fuel_type: string
  transmission: string
  max_mileage: string
}

interface FormErrors {
  [key: string]: string
}

export default function EditWantedRequestPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const requestId = params?.id as string
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [originalStatus, setOriginalStatus] = useState<string>('')
  
  const currentYear = new Date().getFullYear()
  const minYear = 1990
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    min_budget: '',
    max_budget: '',
    make: '',
    model: '',
    min_year: '',
    max_year: '',
    location: '',
    phone: '',
    fuel_type: '',
    transmission: '',
    max_mileage: ''
  })

  // Load existing wanted request data
  useEffect(() => {
    if (!user || !requestId) return

    const loadWantedRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('wanted_requests')
          .select('*')
          .eq('id', requestId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error loading wanted request:', error)
          alert('Failed to load wanted request. You may not have permission to edit this request.')
          router.push('/profile?tab=wanted')
          return
        }

        if (data) {
          setOriginalStatus(data.status)
          setFormData({
            title: data.title || '',
            description: data.description || '',
            min_budget: data.min_budget?.toString() || '',
            max_budget: data.max_budget?.toString() || '',
            make: data.make || '',
            model: data.model || '',
            min_year: data.min_year?.toString() || '',
            max_year: data.max_year?.toString() || '',
            location: data.location || '',
            phone: data.phone || '',
            fuel_type: data.fuel_type || '',
            transmission: data.transmission || '',
            max_mileage: data.max_mileage?.toString() || ''
          })

          // Set district from location
          if (data.location) {
            const district = DISTRICTS.find(d => 
              getCitiesByDistrictId(d.id).some(city => city.name === data.location)
            )
            if (district) {
              setSelectedDistrict(district.name)
            }
          }
        }
      } catch (error) {
        console.error('Error loading wanted request:', error)
        alert('Failed to load wanted request.')
        router.push('/profile?tab=wanted')
      } finally {
        setLoadingData(false)
      }
    }

    loadWantedRequest()
  }, [user, requestId, router])

  // Update available models when make changes
  useEffect(() => {
    if (formData.make) {
      const makeKey = formData.make.toLowerCase().replace('-', '')
      setAvailableModels(MAKE_MODEL_MAP[makeKey] || [])
      // Clear model if it's not in the new make's models
      if (formData.model && !MAKE_MODEL_MAP[makeKey]?.includes(formData.model)) {
        setFormData(prev => ({ ...prev, model: '' }))
      }
    } else {
      setAvailableModels([])
    }
  }, [formData.make])

  // Handle district/city selection
  useEffect(() => {
    if (selectedDistrict) {
      const district = getDistrictByName(selectedDistrict)
      if (district) {
        const cities = getCitiesByDistrictId(district.id)
        setAvailableCities(cities.map(c => c.name))
      }
    } else {
      setAvailableCities([])
      setFormData(prev => ({ ...prev, location: '' }))
    }
  }, [selectedDistrict])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.min_budget) {
      newErrors.min_budget = 'Minimum budget is required'
    }

    if (!formData.max_budget) {
      newErrors.max_budget = 'Maximum budget is required'
    }

    if (formData.min_budget && formData.max_budget && 
        parseInt(formData.min_budget) > parseInt(formData.max_budget)) {
      newErrors.max_budget = 'Maximum budget must be greater than minimum budget'
    }

    if (!formData.location) {
      newErrors.location = 'Location is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/wanted-requests/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          title: formData.title,
          description: formData.description,
          min_budget: parseInt(formData.min_budget),
          max_budget: parseInt(formData.max_budget),
          make: formData.make || null,
          model: formData.model || null,
          min_year: formData.min_year ? parseInt(formData.min_year) : null,
          max_year: formData.max_year ? parseInt(formData.max_year) : null,
          location: formData.location,
          phone: formData.phone,
          fuel_type: formData.fuel_type || null,
          transmission: formData.transmission || null,
          max_mileage: formData.max_mileage ? parseInt(formData.max_mileage) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wanted request')
      }

      alert(data.message)
      router.push('/profile?tab=wanted')
      
    } catch (error) {
      console.error('Error updating wanted request:', error)
      alert(error instanceof Error ? error.message : 'Failed to update wanted request')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wanted request...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profile?tab=wanted"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            <i className="fas fa-arrow-left"></i>
            Back to My Wanted Requests
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {originalStatus === 'deleted' ? 'Edit & Resubmit Wanted Request' : 'Edit Wanted Request'}
          </h1>
          
          {originalStatus === 'deleted' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                <p className="text-sm text-yellow-800">
                  This wanted request was removed due to reports. Make necessary changes and resubmit for review.
                </p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="grid gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Looking for Toyota Prius 2018-2020"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe what you're looking for, preferred condition, color preferences, etc."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              {/* Budget Range */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget (Rs) *
                  </label>
                  <input
                    type="number"
                    name="min_budget"
                    value={formData.min_budget}
                    onChange={handleInputChange}
                    placeholder="1500000"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.min_budget ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.min_budget && <p className="text-red-500 text-sm mt-1">{errors.min_budget}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Budget (Rs) *
                  </label>
                  <input
                    type="number"
                    name="max_budget"
                    value={formData.max_budget}
                    onChange={handleInputChange}
                    placeholder="3000000"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.max_budget ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.max_budget && <p className="text-red-500 text-sm mt-1">{errors.max_budget}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Specifications</h2>
            
            <div className="grid gap-6">
              {/* Make and Model */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <select
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Make</option>
                    {VEHICLE_MAKES.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    disabled={!formData.make}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Any Model</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year Range */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Year
                  </label>
                  <select
                    name="min_year"
                    value={formData.min_year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Year</option>
                    {Array.from({ length: currentYear - minYear + 1 }, (_, i) => {
                      const year = currentYear - i
                      return <option key={year} value={year}>{year}</option>
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Year
                  </label>
                  <select
                    name="max_year"
                    value={formData.max_year}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Year</option>
                    {Array.from({ length: currentYear - minYear + 1 }, (_, i) => {
                      const year = currentYear - i
                      return <option key={year} value={year}>{year}</option>
                    })}
                  </select>
                </div>
              </div>

              {/* Fuel Type and Transmission */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fuel Type
                  </label>
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Fuel Type</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="electric">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transmission
                  </label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="cvt">CVT</option>
                  </select>
                </div>
              </div>

              {/* Maximum Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Mileage (km)
                </label>
                <input
                  type="number"
                  name="max_mileage"
                  value={formData.max_mileage}
                  onChange={handleInputChange}
                  placeholder="150000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location and Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location & Contact</h2>
            
            <div className="grid gap-6">
              {/* Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map(district => (
                      <option key={district.id} value={district.name}>{district.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={!selectedDistrict}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select City</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0771234567"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/profile?tab=wanted"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
            >
              {loading && <i className="fas fa-spinner fa-spin"></i>}
              {originalStatus === 'deleted' ? 'Resubmit Request' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
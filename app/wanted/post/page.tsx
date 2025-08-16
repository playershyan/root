'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  DISTRICTS, 
  getCitiesByDistrictId,
  getDistrictByName 
} from '@/lib/constants/locations'

// Import constants - if you created separate files, use these imports:
// import { SRI_LANKA_LOCATIONS, VEHICLE_MAKES, MAKE_MODEL_MAP, FUEL_TYPES, TRANSMISSION_TYPES } from '@/lib/constants/vehicles'


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

export default function PostWantedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Multi-step form
  const [showPreview, setShowPreview] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  
  const currentYear = new Date().getFullYear()
  const minYear = 1990
  
  // Format budget to nearest 0.5M increment with K/M suffix
  const formatBudget = (value: string | number | null | undefined): string => {
    if (!value) return '0'
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (!numValue) return '0'
    
    // For values under 1M, round to nearest 50K
    if (numValue < 1000000) {
      const rounded = Math.round(numValue / 50000) * 50000
      const thousands = rounded / 1000
      return `${thousands}K`
    }
    
    // For values 1M and above, round to nearest 0.5M
    const rounded = Math.round(numValue / 500000) * 500000
    const millions = rounded / 1000000
    
    // Display with one decimal place if not a whole number
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`
  }
  const [formData, setFormData] = useState<FormData>({
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

  // Generate title from make and model
  const generateTitle = () => {
    if (!formData.make) return ''
    
    const makeModel = [formData.make, formData.model].filter(Boolean).join(' ')
    const yearRange = formData.min_year && formData.max_year 
      ? ` ${formData.min_year}-${formData.max_year}` 
      : formData.min_year 
      ? ` ${formData.min_year} onwards`
      : formData.max_year
      ? ` up to ${formData.max_year}`
      : ''
    
    return `${makeModel}${yearRange}`
  }

  useEffect(() => {
    if (selectedDistrict) {
      const district = getDistrictByName(selectedDistrict)
      if (district) {
        const cities = getCitiesByDistrictId(district.id)
        setAvailableCities(cities.map(c => c.name))
      }
    } else {
      setAvailableCities([])
      // Reset city selection when district is cleared
      setFormData(prev => ({ ...prev, location: '' }))
    }
  }, [selectedDistrict])

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {}

    switch (stepNumber) {
      case 1:
        if (!formData.make) {
          newErrors.make = 'Please select a vehicle make'
        }
        if (!formData.model) {
          newErrors.model = 'Please select a vehicle model'
        }
        if (!formData.min_budget) {
          newErrors.min_budget = 'Please enter minimum budget'
        }
        if (!formData.max_budget) {
          newErrors.max_budget = 'Please enter maximum budget'
        }
        if (formData.min_budget && formData.max_budget && 
            parseFloat(formData.min_budget) > parseFloat(formData.max_budget)) {
          newErrors.max_budget = 'Maximum budget must be greater than minimum'
        }
        if (!formData.min_year) {
          newErrors.min_year = 'Please enter minimum year'
        } else {
          const year = parseInt(formData.min_year)
          if (year < minYear) {
            newErrors.min_year = `Year cannot be earlier than ${minYear}`
          } else if (year > currentYear) {
            newErrors.min_year = `Year cannot be later than ${currentYear}`
          }
        }
        
        if (!formData.max_year) {
          newErrors.max_year = 'Please enter maximum year'
        } else {
          const year = parseInt(formData.max_year)
          if (year < minYear) {
            newErrors.max_year = `Year cannot be earlier than ${minYear}`
          } else if (year > currentYear) {
            newErrors.max_year = `Year cannot be later than ${currentYear}`
          }
        }
        
        if (formData.min_year && formData.max_year && 
            !newErrors.min_year && !newErrors.max_year &&
            parseInt(formData.min_year) > parseInt(formData.max_year)) {
          newErrors.max_year = 'Maximum year must be greater than minimum'
        }
        break
      case 2:
        if (!formData.phone) {
          newErrors.phone = 'Phone number is required'
        } else if (!/^0\d{9}$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid Sri Lankan phone number (e.g., 0771234567)'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    } else {
      // Scroll to the first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-500')
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Focus the field if it's an input
          if (firstErrorField instanceof HTMLInputElement || 
              firstErrorField instanceof HTMLSelectElement || 
              firstErrorField instanceof HTMLTextAreaElement) {
            firstErrorField.focus()
          }
        }
      }, 100)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(2)) {
      // Scroll to the first error field
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-500')
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Focus the field if it's an input
          if (firstErrorField instanceof HTMLInputElement || 
              firstErrorField instanceof HTMLSelectElement || 
              firstErrorField instanceof HTMLTextAreaElement) {
            firstErrorField.focus()
          }
        }
      }, 100)
      return
    }

    setLoading(true)



    // Combine city and district for location
    const locationString = formData.location && selectedDistrict ``
      ? `${formData.location}, ${selectedDistrict}` 
      : formData.location || selectedDistrict

    const title = generateTitle()
    
    try {
      const { error } = await supabase.from('wanted_requests').insert([
        {
          title: title,
          description: formData.description.trim() || null,
          min_budget: formData.min_budget ? parseFloat(formData.min_budget) : null,
          max_budget: formData.max_budget ? parseFloat(formData.max_budget) : null,
          make: formData.make || null,
          model: formData.model || null,
          min_year: formData.min_year ? parseInt(formData.min_year) : null,
          max_year: formData.max_year ? parseInt(formData.max_year) : null,
          location: locationString,
          phone: formData.phone,
          fuel_type: formData.fuel_type || null,
          transmission: formData.transmission || null,
          max_mileage: formData.max_mileage ? parseInt(formData.max_mileage) : null,
          is_active: true
        },
      ])

      if (error) throw error

      router.push('/wanted/post/boost?new=true')
    } catch (error) {
      alert('Error posting request. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatPreviewBudget = () => {
    if (!formData.min_budget && !formData.max_budget) return 'Not specified'
    if (!formData.min_budget) return `Up to Rs. ${formatBudget(formData.max_budget)}`
    if (!formData.max_budget) return `Rs. ${formatBudget(formData.min_budget)}+`
    return `Rs. ${formatBudget(formData.min_budget)} - ${formatBudget(formData.max_budget)}`
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wanted" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
            <span>←</span> Back to Wanted Requests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Post a Wanted Request</h1>
          <p className="text-gray-600 mt-2">Let sellers know what vehicle you're looking for</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-3 font-medium">Vehicle Details</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-3 font-medium">Contact Info</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <i className="fas fa-lightbulb text-blue-600 text-xl"></i>
            <div>
              <p className="text-blue-900 font-semibold mb-1">How it works:</p>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Post your requirements and budget</li>
                <li>• We'll notify thousands of sellers with matching vehicles</li>
                <li>• Sellers will contact you directly</li>
                <li>• Compare offers and choose the best deal</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Step 1: Vehicle Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">What vehicle are you looking for?</h2>
              
              {/* Make and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vehicle Make <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.make ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.make}
                    onChange={(e) => {
                      setFormData({ ...formData, make: e.target.value })
                      if (errors.make) setErrors({ ...errors, make: '' })
                    }}
                    required
                  >
                    <option value="">Select Make</option>
                    {VEHICLE_MAKES.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                  {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.model ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.model}
                    onChange={(e) => {
                      setFormData({ ...formData, model: e.target.value })
                      if (errors.model) setErrors({ ...errors, model: '' })
                    }}
                    disabled={!formData.make || availableModels.length === 0}
                    required
                  >
                    <option value="">Select Model</option>
                    {availableModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget Range (LKR) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      placeholder="Minimum"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.min_budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.min_budget}
                      onChange={(e) => {
                        setFormData({ ...formData, min_budget: e.target.value })
                        if (errors.min_budget) setErrors({ ...errors, min_budget: '' })
                      }}
                      required
                    />
                    {errors.min_budget && <p className="text-red-500 text-sm mt-1">{errors.min_budget}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Maximum"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.max_budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.max_budget}
                      onChange={(e) => {
                        setFormData({ ...formData, max_budget: e.target.value })
                        if (errors.max_budget) setErrors({ ...errors, max_budget: '' })
                      }}
                      required
                    />
                    {errors.max_budget && <p className="text-red-500 text-sm mt-1">{errors.max_budget}</p>}
                  </div>
                </div>
              </div>


              {/* Year Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Year Range <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min={minYear}
                      max={currentYear}
                      placeholder={`From year (${minYear}-${currentYear})`}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.min_year ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.min_year}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, min_year: value })
                        
                        // Real-time validation
                        if (value) {
                          const year = parseInt(value)
                          if (year < minYear || year > currentYear) {
                            setErrors({ ...errors, min_year: year < minYear 
                              ? `Year cannot be earlier than ${minYear}` 
                              : `Year cannot be later than ${currentYear}` })
                          } else {
                            setErrors({ ...errors, min_year: '' })
                          }
                        } else {
                          setErrors({ ...errors, min_year: '' })
                        }
                      }}
                      required
                    />
                    {errors.min_year && <p className="text-red-500 text-sm mt-1">{errors.min_year}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      min={minYear}
                      max={currentYear}
                      placeholder={`To year (${minYear}-${currentYear})`}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.max_year ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.max_year}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, max_year: value })
                        
                        // Real-time validation
                        if (value) {
                          const year = parseInt(value)
                          if (year < minYear || year > currentYear) {
                            setErrors({ ...errors, max_year: year < minYear 
                              ? `Year cannot be earlier than ${minYear}` 
                              : `Year cannot be later than ${currentYear}` })
                          } else {
                            setErrors({ ...errors, max_year: '' })
                          }
                        } else {
                          setErrors({ ...errors, max_year: '' })
                        }
                      }}
                      required
                    />
                    {errors.max_year && <p className="text-red-500 text-sm mt-1">{errors.max_year}</p>}
                  </div>
                </div>
              </div>

              {/* Additional Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fuel Type</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                  >
                    <option value="">Any Fuel Type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transmission</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                  >
                    <option value="">Any Transmission</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              {/* Maximum Mileage */}
              <div>
                <label className="block text-sm font-medium mb-2">Maximum Mileage (km)</label>
                <input
                  type="number"
                  placeholder="e.g., 80000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.max_mileage}
                  onChange={(e) => setFormData({ ...formData, max_mileage: e.target.value })}
                />
                <p className="text-sm text-gray-600 mt-1">Leave empty if mileage doesn't matter</p>
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Describe any specific features, condition requirements, or preferences..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) {
                      setFormData({ ...formData, description: e.target.value })
                    }
                  }}
                  maxLength={150}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {formData.description.length}/150 characters
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Next: Contact Details →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-6">Your Contact Information</h2>
              
              {/* Location Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* District Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred District <span className="text-gray-500">(optional)</span>
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value)
                      setFormData(prev => ({ ...prev, location: '' })) // Reset city when district changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select District</option>
                    {DISTRICTS.map(district => (
                      <option key={district.id} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* City Select - Only show if district is selected */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred City/Area <span className="text-gray-500">(optional)</span>
                  </label>
                  {selectedDistrict ? (
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select City</option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value=""
                      disabled
                      placeholder="Please select a district first"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., 0771234567"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    if (errors.phone) setErrors({ ...errors, phone: '' })
                  }}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                <p className="text-sm text-gray-600 mt-1">Sellers will contact you on this number</p>
              </div>

              {/* Preview Section */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Preview Your Request</h3>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>
                
                {showPreview && (
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-2">{generateTitle() || 'Please select a vehicle make'}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{formatPreviewBudget()}</span>
                      </div>
                      {formData.make && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Make:</span>
                          <span className="font-medium">{formData.make}</span>
                        </div>
                      )}
                      {formData.model && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{formData.model}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{formData.location || 'Not specified'}</span>
                      </div>
                    </div>
                    {formData.description && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-700">{formData.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Terms and Submit */}
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Your phone number will be visible to sellers. 
                    Only share additional contact information with verified sellers.
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Posting...
                      </span>
                    ) : (
                      'Post Wanted Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

       </div>
    </div>
  )
}
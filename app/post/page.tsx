'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Car, Camera, MapPin, Phone, CreditCard, CheckCircle, 
  AlertCircle, Upload, X, Sparkles, ChevronRight, 
  FileText, User, Image as ImageIcon, Star
} from 'lucide-react'
import { 
  DISTRICTS, 
  getCitiesByDistrictId,
  getDistrictByName 
} from '@/lib/constants/locations'

const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Suzuki', 'Mitsubishi',
  'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Hyundai', 'Kia',
  'Ford', 'Chevrolet', 'Isuzu', 'Daihatsu', 'Subaru', 'Lexus'
]

const MODELS_BY_MAKE: Record<string, string[]> = {
  'Toyota': ['Prius', 'Aqua', 'Corolla', 'Yaris', 'Vitz', 'Allion', 'Premio', 'Camry', 'CHR', 'Hilux', 'Land Cruiser'],
  'Honda': ['Civic', 'Fit', 'Vezel', 'Grace', 'City', 'CRV', 'HRV', 'Accord', 'Freed'],
  'Nissan': ['Leaf', 'March', 'Sunny', 'X-Trail', 'Tiida', 'Bluebird', 'Skyline'],
  'Suzuki': ['Alto', 'Swift', 'WagonR', 'Celerio', 'Every', 'Jimny', 'Vitara'],
  'Mazda': ['Axela', 'Demio', 'CX-3', 'CX-5', 'Familia', 'Atenza'],
  'Mitsubishi': ['Lancer', 'Montero', 'Outlander', 'Mirage', 'Pajero'],
}

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG']
const TRANSMISSION_TYPES = ['Manual', 'Automatic', 'CVT', 'Tiptronic']
const BODY_TYPES = ['Sedan', 'Hatchback', 'SUV', 'Van', 'Pickup', 'Coupe', 'Wagon', 'Convertible']
const VEHICLE_CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor']
const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Brown', 'Green', 'Pearl', 'Other']

type VehicleType = 'car' | 'van' | 'motorcycle' | 'three-wheeler'
type PricingType = 'cash' | 'finance'
type AIStyle = 'professional' | 'personal' | 'detailed' | 'urgent'

interface FormData {
  // Step 1 - Basic Details
  vehicleType: VehicleType | ''
  title: string
  make: string
  model: string
  year: string
  mileage: string
  condition: string
  engineCapacity: string
  fuelType: string
  transmission: string
  bodyType: string
  color: string
  
  // Location
  district: string
  city: string
  
  // Pricing
  pricingType: PricingType
  price: string
  negotiable: boolean
  
  // Finance Details
  financeType: string
  financeProvider: string
  originalAmount: string
  outstandingBalance: string
  monthlyPayment: string
  remainingTerm: string
  earlySettlement: string
  
  // Step 2 - Features & Photos
  features: string[]
  images: File[]
  imageUrls: string[]
  
  // Description
  description: string
  aiStyle: AIStyle
  
  // Step 3 - Contact
  phone: string
  whatsapp: string
  whatsappSameAsPhone: boolean
  email: string
  preferredContact: 'phone' | 'whatsapp' | 'email'
  bestTimeToCall: string
}

const initialFormData: FormData = {
  vehicleType: '',
  title: '',
  make: '',
  model: '',
  year: '',
  mileage: '',
  condition: 'Good',
  engineCapacity: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  bodyType: 'Sedan',
  color: 'White',
  district: '',
  city: '',
  pricingType: 'cash',
  price: '',
  negotiable: false,
  financeType: '',
  financeProvider: '',
  originalAmount: '',
  outstandingBalance: '',
  monthlyPayment: '',
  remainingTerm: '',
  earlySettlement: '',
  features: [],
  images: [],
  imageUrls: [],
  description: '',
  aiStyle: 'professional',
  phone: '',
  whatsapp: '',
  whatsappSameAsPhone: true,
  email: '',
  preferredContact: 'phone',
  bestTimeToCall: 'anytime'
}

const SAFETY_FEATURES = [
  'Multiple Airbags', 'ABS Brakes', 'Stability Control', 
  'Traction Control', 'Lane Departure Warning', 'Blind Spot Detection',
  'Rear Cross Traffic Alert', 'Emergency Braking'
]

const TECH_FEATURES = [
  'Touch Display', 'Bluetooth', 'USB Ports', 'Backup Camera',
  'Parking Sensors', 'Wireless Charging', 'Premium Audio',
  'Apple CarPlay', 'Android Auto', 'Navigation System'
]

const COMFORT_FEATURES = [
  'Climate Control', 'Power Windows', 'Power Mirrors', 
  'Keyless Entry', 'Push Start', 'Cruise Control',
  'Leather Seats', 'Sunroof', 'Power Seats'
]

export default function EnhancedPostVehiclePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  
  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('vehiclePostDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData({ ...initialFormData, ...parsed })
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [])
  
  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('vehiclePostDraft', JSON.stringify(formData))
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [formData])
  
  // Update WhatsApp when phone changes
  useEffect(() => {
    if (formData.whatsappSameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }))
    }
  }, [formData.phone, formData.whatsappSameAsPhone])

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
      setFormData(prev => ({ ...prev, city: '' }))
    }
  }, [selectedDistrict])
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.vehicleType) newErrors.vehicleType = 'Please select vehicle type'
      if (!formData.title) newErrors.title = 'Title is required'
      if (!formData.make) newErrors.make = 'Make is required'
      if (!formData.model) newErrors.model = 'Model is required'
      if (!formData.year) newErrors.year = 'Year is required'
      if (!formData.district) newErrors.district = 'District is required'
      if (!formData.city) newErrors.city = 'City is required'
      if (!formData.price) newErrors.price = 'Price is required'
      
      if (formData.pricingType === 'finance') {
        if (!formData.financeType) newErrors.financeType = 'Finance type is required'
        if (!formData.outstandingBalance) newErrors.outstandingBalance = 'Outstanding balance is required'
      }
    } else if (step === 2) {
      if (formData.images.length === 0 && formData.imageUrls.length === 0) {
        newErrors.images = 'At least one image is required'
      }
      if (!formData.description) newErrors.description = 'Description is required'
    } else if (step === 3) {
      if (!formData.phone) newErrors.phone = 'Phone number is required'
      if (!formData.whatsapp && !formData.whatsappSameAsPhone) {
        newErrors.whatsapp = 'WhatsApp number is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    )
    
    if (files.length + formData.images.length > 15) {
      alert('Maximum 15 images allowed')
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    )
    
    if (files.length + formData.images.length > 15) {
      alert('Maximum 15 images allowed')
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }
  
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }
  
  const generateAIDescription = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      alert('Please fill in make, model, and year first')
      return
    }
    
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          mileage: formData.mileage,
          fuel_type: formData.fuelType,
          transmission: formData.transmission,
          condition: formData.condition,
          features: formData.features,
          style: formData.aiStyle
        }),
      })
      
      const data = await response.json()
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }))
      }
    } catch (error) {
      alert('Error generating description')
    } finally {
      setAiLoading(false)
    }
  }
  
  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    setLoading(true)
    try {
      // Here you would upload images to storage and get URLs
      // For now, we'll use the imageUrls field
      
      const { error } = await supabase.from('listings').insert([
        {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year),
          mileage: parseInt(formData.mileage) || null,
          fuel_type: formData.fuelType,
          transmission: formData.transmission,
          location: `${formData.city}, ${formData.district}`,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          image_url: formData.imageUrls[0] || null,
          image_urls: formData.imageUrls,
          is_featured: false,
          is_sold: false
        },
      ])
      
      if (error) throw error
      
      // Clear draft
      localStorage.removeItem('vehiclePostDraft')
      
      alert('Vehicle listed successfully!')
      router.push('/listings')
    } catch (error) {
      alert('Error posting vehicle. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const getModelOptions = () => {
    if (!formData.make) return []
    return MODELS_BY_MAKE[formData.make] || []
  }
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sell Your Vehicle</h1>
          <p className="text-gray-600">Reach thousands of potential buyers across Sri Lanka</p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-20 h-1 mx-2 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              Vehicle Details
            </span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              Photos & Description
            </span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}>
              Contact & Publish
            </span>
          </div>
        </div>
        
        {/* AI Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Star className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">
            AI-assisted form • Auto-generates descriptions • Verify all details before publishing
          </span>
        </div>
        
        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
          {/* Step 1: Vehicle Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  What type of vehicle are you selling?
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { value: 'car', label: 'Cars', icon: 'fas fa-car' },
                    { value: 'van', label: 'Vans', icon: 'fas fa-shuttle-van' },
                    { value: 'motorcycle', label: 'Motorcycles', icon: 'fas fa-motorcycle' },
                    { value: 'three-wheeler', label: 'Three Wheelers', icon: 'fas fa-taxi' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vehicleType: type.value as VehicleType }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.vehicleType === type.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2"><i className={type.icon}></i></div>
                      <div className="font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
                {errors.vehicleType && (
                  <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Listing Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., 2019 Toyota Prius - Excellent Condition"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : ''
                  }`}
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Make *</label>
                  <select
                    value={formData.make}
                    onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value, model: '' }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.make ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select Make</option>
                    {VEHICLE_MAKES.map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                  {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Model *</label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    disabled={!formData.make}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.model ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select Model</option>
                    {getModelOptions().map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.year ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                    placeholder="e.g., 45000"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {VEHICLE_CONDITIONS.map(condition => (
                      <option key={condition} value={condition}>{condition}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Engine Capacity (cc)</label>
                  <input
                    type="number"
                    value={formData.engineCapacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, engineCapacity: e.target.value }))}
                    placeholder="e.g., 1800"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {FUEL_TYPES.map(fuel => (
                      <option key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {TRANSMISSION_TYPES.map(trans => (
                      <option key={trans} value={trans}>{trans}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Body Type</label>
                  <select
                    value={formData.bodyType}
                    onChange={(e) => setFormData(prev => ({ ...prev, bodyType: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {BODY_TYPES.map(body => (
                      <option key={body} value={body}>{body}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* District Select */}
                  <div>
                    <label className="block text-sm font-medium mb-2">District *</label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value)
                        setFormData(prev => ({ 
                          ...prev, 
                          district: e.target.value,
                          city: '' // Reset city selection when district changes
                        }))
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.district ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select District</option>
                      {DISTRICTS.map(district => (
                        <option key={district.id} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
                  </div>
                  
                  {/* City Select - Only show if district is selected */}
                  <div>
                    <label className="block text-sm font-medium mb-2">City/Town *</label>
                    {selectedDistrict ? (
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-500' : ''
                        }`}
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
                        value={formData.city}
                        disabled
                        placeholder="Please select a district first"
                        className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    )}
                    {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Pricing
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Pricing Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="cash"
                        checked={formData.pricingType === 'cash'}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricingType: e.target.value as PricingType }))}
                        className="mr-2"
                      />
                      Cash Price
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="finance"
                        checked={formData.pricingType === 'finance'}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricingType: e.target.value as PricingType }))}
                        className="mr-2"
                      />
                      Finance/Leasing
                    </label>
                  </div>
                </div>
                
                {formData.pricingType === 'cash' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (LKR) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="e.g., 5500000"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    
                    <label className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        checked={formData.negotiable}
                        onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                        className="mr-2"
                      />
                      Price is negotiable
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Finance Type *</label>
                        <select
                          value={formData.financeType}
                          onChange={(e) => setFormData(prev => ({ ...prev, financeType: e.target.value }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.financeType ? 'border-red-500' : ''
                          }`}
                        >
                          <option value="">Select Type</option>
                          <option value="bank_loan">Bank Loan</option>
                          <option value="leasing">Leasing</option>
                          <option value="hire_purchase">Hire Purchase</option>
                        </select>
                        {errors.financeType && <p className="text-red-500 text-sm mt-1">{errors.financeType}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Finance Provider</label>
                        <input
                          type="text"
                          value={formData.financeProvider}
                          onChange={(e) => setFormData(prev => ({ ...prev, financeProvider: e.target.value }))}
                          placeholder="e.g., Commercial Bank"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Original Amount</label>
                        <input
                          type="number"
                          value={formData.originalAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, originalAmount: e.target.value }))}
                          placeholder="e.g., 6000000"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Outstanding Balance *</label>
                        <input
                          type="number"
                          value={formData.outstandingBalance}
                          onChange={(e) => setFormData(prev => ({ ...prev, outstandingBalance: e.target.value, price: e.target.value }))}
                          placeholder="e.g., 3500000"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            errors.outstandingBalance ? 'border-red-500' : ''
                          }`}
                        />
                        {errors.outstandingBalance && <p className="text-red-500 text-sm mt-1">{errors.outstandingBalance}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Monthly Payment</label>
                        <input
                          type="number"
                          value={formData.monthlyPayment}
                          onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                          placeholder="e.g., 65000"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Remaining Term</label>
                        <input
                          type="text"
                          value={formData.remainingTerm}
                          onChange={(e) => setFormData(prev => ({ ...prev, remainingTerm: e.target.value }))}
                          placeholder="e.g., 36 months"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 2: Photos & Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Photos
                </h2>
                
                {/* Image Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  } ${errors.images ? 'border-red-500' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    Drag and drop photos here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum 15 photos, up to 5MB each. JPG, PNG formats.
                  </p>
                </div>
                {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
                
                {/* Image Preview Grid */}
                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                    {formData.images.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Alternative: URL Input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Or add image URLs</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        if (input.value) {
                          setFormData(prev => ({
                            ...prev,
                            imageUrls: [...prev.imageUrls, input.value]
                          }))
                          input.value = ''
                        }
                      }
                    }}
                  />
                  <p className="text-sm text-gray-500 mt-1">Press Enter to add URL</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Features & Equipment</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Safety Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {SAFETY_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, features: [...prev.features, feature] }))
                              } else {
                                setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Technology Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {TECH_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, features: [...prev.features, feature] }))
                              } else {
                                setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Comfort Features</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {COMFORT_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, features: [...prev.features, feature] }))
                              } else {
                                setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{feature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Description
                </h3>
                
                {/* AI Style Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">AI Writing Style</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'professional', label: 'Professional', icon: 'fas fa-briefcase' },
                      { value: 'personal', label: 'Personal', icon: 'fas fa-handshake' },
                      { value: 'detailed', label: 'Detailed', icon: 'fas fa-clipboard-list' },
                      { value: 'urgent', label: 'Urgent Sale', icon: 'fas fa-bolt' }
                    ].map(style => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, aiStyle: style.value as AIStyle }))}
                        className={`p-3 rounded-lg border text-sm ${
                          formData.aiStyle === style.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-xl mb-1"><i className={style.icon}></i></div>
                        <div>{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={aiLoading}
                    className="btn-primary bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? 'Generating...' : 'Generate AI Description'}
                  </button>
                </div>
                
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vehicle in detail..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-500' : ''
                  }`}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    {formData.description.length} characters
                  </span>
                  {formData.description && (
                    <span className="text-sm text-green-600">
                      ✓ Good description
                    </span>
                  )}
                </div>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          )}
          
          {/* Step 3: Contact & Publish */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Contact Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g., 0771234567"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp Number</label>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.whatsappSameAsPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappSameAsPhone: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Same as phone number</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="e.g., 0771234567"
                      disabled={formData.whatsappSameAsPhone}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        formData.whatsappSameAsPhone ? 'bg-gray-100' : ''
                      } ${errors.whatsapp ? 'border-red-500' : ''}`}
                    />
                    {errors.whatsapp && <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g., your@email.com"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
                    <select
                      value={formData.preferredContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferredContact: e.target.value as 'phone' | 'whatsapp' | 'email' }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="phone">Phone Call</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Best Time to Call</label>
                    <select
                      value={formData.bestTimeToCall}
                      onChange={(e) => setFormData(prev => ({ ...prev, bestTimeToCall: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="anytime">Anytime</option>
                      <option value="morning">Morning (8AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 5PM)</option>
                      <option value="evening">Evening (5PM - 9PM)</option>
                      <option value="weekend">Weekends Only</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Preview Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Listing Preview</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                  <p><strong>Vehicle:</strong> {formData.year} {formData.make} {formData.model}</p>
                  <p><strong>Price:</strong> Rs. {formData.price ? parseFloat(formData.price).toLocaleString() : '0'}</p>
                  <p><strong>Location:</strong> {formData.city}, {formData.district}</p>
                  <p><strong>Photos:</strong> {formData.images.length + formData.imageUrls.length} uploaded</p>
                  <p><strong>Features:</strong> {formData.features.length} selected</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-secondary"
              >
                Previous
              </button>
            )}
            
            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/listings')}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Tips Sidebar - Only on desktop */}
        <div className="hidden lg:block lg:col-span-1 mt-8">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Selling Tips
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Take photos in good lighting, preferably outdoors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Include photos of interior, exterior, engine, and documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Be honest about the vehicle condition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Price competitively based on market rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Respond to inquiries promptly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Have all documents ready for serious buyers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
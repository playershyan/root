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
import {
  VehicleType,
  getVehicleCategories,
  getMakesByCategory,
  getModelsByMake
} from '@/lib/constants/vehicleData'
import VehicleFormFactory from '@/app/components/vehicle-forms/VehicleFormFactory'
import { BaseVehicleFormData } from '@/app/components/vehicle-forms/types'

// Vehicle makes and models are now loaded from vehicleData.ts
// Form constants are now in the vehicle-forms types

// VehicleType is now imported from vehicleData.ts
type PricingType = 'cash' | 'finance'
type AIStyle = 'professional' | 'personal' | 'detailed' | 'urgent'

interface FormData extends BaseVehicleFormData {
  vehicleType: VehicleType | ''
  showVehicleDropdown?: boolean
  aiStyle: AIStyle
  whatsappSameAsPhone: boolean
  preferredContact: 'phone' | 'whatsapp' | 'email'
  bestTimeToCall: string
}

const initialFormData: FormData = {
  vehicleType: '',
  title: '',
  make: '',
  customMake: '',
  model: '',
  customModel: '',
  year: '',
  mileage: '',
  condition: '',
  engineCapacity: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  color: 'White',
  trim: '',
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
  askingPrice: '',
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

// Feature constants are now in the vehicle-forms types

export default function EnhancedPostVehiclePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const vehicleDropdownRef = useRef<HTMLDivElement>(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (vehicleDropdownRef.current && !vehicleDropdownRef.current.contains(event.target as Node)) {
        setFormData(prev => ({ ...prev, showVehicleDropdown: false }))
      }
    }

    if (formData.showVehicleDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [formData.showVehicleDropdown])
  
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
  
  // Clear make and model when vehicle type changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, make: '', model: '' }))
  }, [formData.vehicleType])
  
  // Generate image preview URLs
  useEffect(() => {
    // Only run on client side after component is mounted
    if (!mounted || !formData.images.length) {
      setImagePreviews([])
      return
    }
    
    try {
      const previews = formData.images.map(file => {
        if (file instanceof File) {
          return URL.createObjectURL(file)
        }
        return ''
      }).filter(url => url !== '')
      
      setImagePreviews(previews)
      
      // Cleanup function to revoke URLs
      return () => {
        previews.forEach(url => {
          if (url) URL.revokeObjectURL(url)
        })
      }
    } catch (error) {
      console.error('Error creating image previews:', error)
      setImagePreviews([])
    }
  }, [formData.images, mounted])

  useEffect(() => {
    if (selectedDistrict) {
      const district = getDistrictByName(selectedDistrict)
      if (district) {
        const cities = getCitiesByDistrictId(district.id)
        setAvailableCities(cities.map(c => c.name))
      }
    } else {
      setAvailableCities([])
      setFormData(prev => ({ ...prev, city: '' }))
    }
  }, [selectedDistrict])
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.vehicleType) newErrors.vehicleType = 'Please select vehicle type'
      if (!formData.title) newErrors.title = 'Title is required'
      if (!formData.make) {
        newErrors.make = 'Make is required'
      } else if (formData.make === 'Other' && !formData.customMake) {
        newErrors.make = 'Please enter custom make name'
      }
      if (!formData.model) {
        newErrors.model = 'Model is required'
      } else if (formData.model === 'Other' && !formData.customModel) {
        newErrors.model = 'Please enter custom model name'
      }
      if (!formData.year) newErrors.year = 'Year is required'
      if (!formData.mileage) newErrors.mileage = 'Mileage is required'
      if (!formData.condition) newErrors.condition = 'Vehicle condition is required'
      if (!formData.trim) newErrors.trim = 'Trim/grade is required'
      if (!formData.district) newErrors.district = 'District is required'
      if (!formData.city) newErrors.city = 'City is required'
      if (!formData.price) newErrors.price = 'Price is required'
      
      if (formData.pricingType === 'finance') {
        if (!formData.financeType) newErrors.financeType = 'Finance type is required'
        if (!formData.outstandingBalance) newErrors.outstandingBalance = 'Outstanding balance is required'
        if (!formData.askingPrice) newErrors.askingPrice = 'Asking price is required'
        if (!formData.monthlyPayment) newErrors.monthlyPayment = 'Monthly payment is required'
        if (!formData.remainingTerm) newErrors.remainingTerm = 'Remaining term is required'
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
    
    // Auto-scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0]
      setTimeout(() => {
        let element: HTMLElement | null = null
        
        // Special handling for vehicleType
        if (firstErrorField === 'vehicleType') {
          element = document.querySelector('.vehicle-type-section') as HTMLElement
        } else {
          element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
        }
        
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          })
          if (element.focus) element.focus()
        }
      }, 100)
    }
    
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
      const { error } = await supabase.from('listings').insert([
        {
          title: formData.title,
          description: formData.description,
          vehicle_type: formData.vehicleType,
          price: formData.pricingType === 'finance' 
            ? (parseFloat(formData.askingPrice || '') || parseFloat(formData.outstandingBalance || '') || parseFloat(formData.price || ''))
            : parseFloat(formData.price || ''),
          make: formData.make === 'Other' ? (formData.customMake || 'Other') : formData.make,
          model: formData.model === 'Other' ? (formData.customModel || 'Other') : (formData.model || ''),
          year: parseInt(formData.year || ''),
          mileage: parseInt(formData.mileage || '') || null,
          fuel_type: formData.fuelType,
          transmission: formData.transmission,
          location: `${formData.city}, ${formData.district}`,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          image_url: formData.imageUrls[0] || null,
          image_urls: formData.imageUrls,
          is_featured: false,
          is_sold: false,
          pricing_type: formData.pricingType,
          negotiable: formData.negotiable,
          finance_type: formData.pricingType === 'finance' ? formData.financeType : null,
          finance_provider: formData.pricingType === 'finance' ? formData.financeProvider : null,
          original_amount: formData.pricingType === 'finance' && formData.originalAmount 
            ? parseFloat(formData.originalAmount) : null,
          outstanding_balance: formData.pricingType === 'finance' && formData.outstandingBalance 
            ? parseFloat(formData.outstandingBalance) : null,
          monthly_payment: formData.pricingType === 'finance' && formData.monthlyPayment 
            ? parseFloat(formData.monthlyPayment) : null,
          remaining_term: formData.pricingType === 'finance' ? formData.remainingTerm : null,
          early_settlement: formData.pricingType === 'finance' ? formData.earlySettlement : null,
          asking_price: formData.pricingType === 'finance' && formData.askingPrice 
            ? parseFloat(formData.askingPrice) : null
        },
      ])
      
      if (error) throw error
      
      localStorage.removeItem('vehiclePostDraft')
      router.push('/post/paid-features?new=true')
    } catch (error) {
      alert('Error posting vehicle. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const getModelOptions = () => {
    if (!formData.make || !formData.vehicleType) return []
    return getModelsByMake(formData.vehicleType, formData.make.toLowerCase().replace(/[\s-]/g, '-'))
  }
  
  const getMakeOptions = () => {
    if (!formData.vehicleType) return []
    return getMakesByCategory(formData.vehicleType)
  }
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i)
  
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sell Your Vehicle</h1>
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
          {/* Desktop view - horizontal labels */}
          <div className="hidden md:flex justify-between mt-2 text-sm">
            <span className={currentStep >= 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              Vehicle Details
            </span>
            <span className={currentStep >= 2 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              Photos & Description
            </span>
            <span className={currentStep >= 3 ? 'text-gray-900 font-medium' : 'text-gray-400'}>
              Contact & Publish
            </span>
          </div>
          
          {/* Mobile view - show only current step */}
          <div className="block md:hidden mt-3 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Step {currentStep} of 3
            </div>
            <div className="text-base font-semibold text-gray-900">
              {currentStep === 1 && 'Vehicle Details'}
              {currentStep === 2 && 'Photos & Description'}
              {currentStep === 3 && 'Contact & Publish'}
            </div>
          </div>
        </div>
        
        {/* AI Badge */}
        <div className="relative overflow-hidden rounded-lg p-4 mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 border border-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 animate-pulse"></div>
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50"></div>
              <Star className="relative w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI-assisted form • Verify all details before publishing
            </span>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Step 1: Vehicle Details */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Vehicle Type Section */}
              <div className="vehicle-type-section">
                <div className="border-b border-gray-200 pb-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    What type of vehicle are you selling?
                  </h2>
                  <p className="text-gray-500 text-sm">Select the category that best describes your vehicle</p>
                </div>
                
                {/* Dropdown Menu */}
                <div ref={vehicleDropdownRef} className="relative mb-6">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      showVehicleDropdown: !prev.showVehicleDropdown 
                    } as any))}
                    className={`w-full px-6 py-4 border-2 rounded-lg text-left flex items-center justify-between transition-all ${
                      formData.vehicleType 
                        ? 'border-blue-300 bg-blue-50' 
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {formData.vehicleType ? (
                        <>
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {(() => {
                              const selectedType = getVehicleCategories().find(t => t.value === formData.vehicleType);
                              
                              if (selectedType?.icon === 'custom-three-wheeler') {
                                return (
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 2.01C18.72 1.42 18.16 1 17.5 1h-11C5.84 1 5.28 1.42 5.08 2.01L3 8v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1V8L18.92 2.01zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5S18.33 12 17.5 12zM5 7l1.27-3.82c.14-.42.52-.68.97-.68h9.53c.44 0 .82.26.97.68L19 7H5z"/>
                                    <circle cx="6" cy="19" r="2"/>
                                    <circle cx="18" cy="19" r="2"/>
                                    <circle cx="12" cy="19" r="1.5"/>
                                  </svg>
                                );
                              } else if (selectedType?.icon === 'custom-excavator') {
                                return (
                                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="14" width="10" height="3" rx="1"/>
                                    <rect x="8" y="10" width="4" height="4" rx="0.5"/>
                                    <rect x="12" y="11" width="6" height="1" rx="0.5"/>
                                    <rect x="17" y="7" width="1" height="5" rx="0.5"/>
                                    <path d="M17 6 L19 4 L20 6 L18 8 Z" fill="currentColor"/>
                                    <rect x="4" y="17" width="14" height="2" rx="1"/>
                                    <circle cx="6" cy="18" r="1"/>
                                    <circle cx="9" cy="18" r="1"/>
                                    <circle cx="12" cy="18" r="1"/>
                                    <circle cx="15" cy="18" r="1"/>
                                  </svg>
                                );
                              }
                              return <i className={`${selectedType?.icon} text-lg text-blue-600`}></i>;
                            })()}
                          </div>
                          <span className="text-lg font-medium text-gray-900">
                            {getVehicleCategories().find(t => t.value === formData.vehicleType)?.label}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Choose vehicle type...</span>
                      )}
                    </div>
                    <i className={`fas fa-chevron-${(formData as any).showVehicleDropdown ? 'up' : 'down'} text-gray-400`}></i>
                  </button>
                  
                  {/* Dropdown Options */}
                  {(formData as any).showVehicleDropdown && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                        {getVehicleCategories().map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ 
                              ...prev, 
                              vehicleType: type.value as VehicleType,
                              showVehicleDropdown: false
                            } as any))}
                            className={`w-full p-4 rounded-lg transition-all text-left hover:bg-gray-50 ${
                              formData.vehicleType === type.value
                                ? 'bg-blue-50'
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                {type.icon === 'custom-three-wheeler' ? (
                                  <svg 
                                    className="w-6 h-6 text-gray-700"
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M18.92 2.01C18.72 1.42 18.16 1 17.5 1h-11C5.84 1 5.28 1.42 5.08 2.01L3 8v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1V8L18.92 2.01zM6.5 12c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9s1.5.67 1.5 1.5S7.33 12 6.5 12zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5S18.33 12 17.5 12zM5 7l1.27-3.82c.14-.42.52-.68.97-.68h9.53c.44 0 .82.26.97.68L19 7H5z"/>
                                    <circle cx="6" cy="19" r="2"/>
                                    <circle cx="18" cy="19" r="2"/>
                                    <circle cx="12" cy="19" r="1.5"/>
                                  </svg>
                                ) : type.icon === 'custom-excavator' ? (
                                  <svg 
                                    className="w-6 h-6 text-gray-700"
                                    fill="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <rect x="6" y="14" width="10" height="3" rx="1"/>
                                    <rect x="8" y="10" width="4" height="4" rx="0.5"/>
                                    <rect x="12" y="11" width="6" height="1" rx="0.5"/>
                                    <rect x="17" y="7" width="1" height="5" rx="0.5"/>
                                    <path d="M17 6 L19 4 L20 6 L18 8 Z" fill="currentColor"/>
                                    <rect x="4" y="17" width="14" height="2" rx="1"/>
                                    <circle cx="6" cy="18" r="1"/>
                                    <circle cx="9" cy="18" r="1"/>
                                    <circle cx="12" cy="18" r="1"/>
                                    <circle cx="15" cy="18" r="1"/>
                                  </svg>
                                ) : (
                                  <i className={`${type.icon} text-lg text-gray-700`}></i>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{type.label}</p>
                                <p className="text-xs text-gray-500">{type.description}</p>
                              </div>
                              {formData.vehicleType === type.value && (
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                  <i className="fas fa-check text-white text-xs"></i>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                {errors.vehicleType && (
                  <p className="text-red-600 text-sm mt-3">{errors.vehicleType}</p>
                )}
              </div>
              
              {/* Vehicle Form Factory */}
              <VehicleFormFactory
                vehicleType={formData.vehicleType}
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                getMakeOptions={getMakeOptions}
                getModelOptions={getModelOptions}
              />
              
              {/* Location Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    Location
                  </h2>
                  <p className="text-gray-500 text-sm">Where is your vehicle located?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">District <span className="text-red-500">*</span></label>
                    <select
                      name="district"
                      value={selectedDistrict}
                      onChange={(e) => {
                        setSelectedDistrict(e.target.value)
                        setFormData(prev => ({ 
                          ...prev, 
                          district: e.target.value,
                          city: ''
                        }))
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                        errors.district ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select District</option>
                      {DISTRICTS.map(district => (
                        <option key={district.id} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                    {errors.district && <p className="text-red-600 text-sm mt-1">{errors.district}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City/Town <span className="text-red-500">*</span></label>
                    {selectedDistrict ? (
                      <select
                        name="city"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                          errors.city ? 'border-red-300' : 'border-gray-300'
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    )}
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>
                </div>
              </div>
              
              {/* Pricing and features now handled by VehicleFormFactory */}
            </div>
          )}
          
          {/* Step 2: Photos & Description */}
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-blue-600" />
                  </div>
                  Photos
                </h2>
                <p className="text-gray-500 text-sm">Upload high-quality images of your vehicle</p>
              </div>
              
              <div>
                {/* Image Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-300'
                  } ${errors.images ? 'border-red-300' : ''}`}
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
                  <p className="text-lg font-medium mb-2 text-gray-700">
                    Drag and drop photos here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-900 hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum 15 photos, up to 5MB each. JPG, PNG formats.
                  </p>
                </div>
                {errors.images && <p className="text-red-600 text-sm mt-1">{errors.images}</p>}
                
                {/* Image Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                    {imagePreviews.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        {index === 0 && (
                          <span className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                            Main
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
              
              <div className="border-t border-gray-200 pt-8">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    Description
                  </h2>
                  <p className="text-gray-500 text-sm">Create an attractive description for your listing</p>
                </div>
                
                {/* AI Style Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Writing Style</label>
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
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="text-xl mb-1"><i className={style.icon}></i></div>
                        <div className="text-gray-700">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={generateAIDescription}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {aiLoading ? 'Generating...' : 'Generate AI Description'}
                  </button>
                </div>
                
                <textarea
                  rows={6}
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vehicle in detail..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
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
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          )}
          
          {/* Step 3: Contact & Publish */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  Contact Information
                </h2>
                <p className="text-gray-500 text-sm">How should buyers contact you?</p>
              </div>
              
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g., 0771234567"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={formData.whatsappSameAsPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsappSameAsPhone: e.target.checked }))}
                        className="mr-2 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Same as phone number</span>
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="e.g., 0771234567"
                      disabled={formData.whatsappSameAsPhone}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                        formData.whatsappSameAsPhone ? 'bg-gray-50' : ''
                      } ${errors.whatsapp ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
                  </div>
                </div>
              </div>
              
              {/* Preview Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Listing Preview</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong className="text-gray-900">Title:</strong> {formData.title || 'Not set'}</p>
                  <p><strong className="text-gray-900">Vehicle:</strong> {formData.year} {formData.make} {formData.model}</p>
                  <p><strong className="text-gray-900">Price:</strong> Rs. {formData.price ? parseFloat(formData.price).toLocaleString() : '0'}</p>
                  <p><strong className="text-gray-900">Location:</strong> {formData.city}, {formData.district}</p>
                  <p><strong className="text-gray-900">Photos:</strong> {formData.images.length + formData.imageUrls.length} uploaded</p>
                  <p><strong className="text-gray-900">Features:</strong> {formData.features?.length || 0} selected</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="pt-6 border-t border-gray-200 mt-8">
            {/* Mobile Layout */}
            <div className="block md:hidden space-y-3">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
              
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <span className="text-lg">‹‹</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => router.push('/listings')}
                  className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              
              <div className="ml-auto flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/listings')}
                  className="px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50"
                >
                  Cancel
                </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
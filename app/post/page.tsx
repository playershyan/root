'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import {
  Car, Camera, MapPin, Phone, CreditCard, CheckCircle,
  AlertCircle, Upload, X, Sparkles, ChevronRight,
  FileText, User, Image as ImageIcon, Star
} from 'lucide-react'
import CountrySelector, { useCountrySelector } from '@/app/components/CountrySelector'
import { formatPhoneForStorage, formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
import DescriptionGenerator, { DescriptionGeneratorRef } from '@/app/components/vehicle-forms/DescriptionGenerator'
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
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

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
  // Additional Information fields
  interiorColor?: string
  registrationYear?: string
  vehicleConditionDetails?: string
  previousOwners?: string
  includingFinanceCompanies?: boolean
  serviceRecordsAvailable?: boolean
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
  fuelType: '',
  transmission: '',
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
  // Additional Information fields
  interiorColor: '',
  registrationYear: '',
  vehicleConditionDetails: '',
  previousOwners: '',
  includingFinanceCompanies: false,
  serviceRecordsAvailable: false,
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
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, getPhoneNumber, getWhatsAppNumber } = useUserProfile()
  const { getAIToken } = useRecaptcha()
  const { toasts, showError, removeToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const vehicleDropdownRef = useRef<HTMLDivElement>(null)
  const descriptionGeneratorRef = useRef<DescriptionGeneratorRef>(null)

  // Detect edit mode
  const isEditMode = searchParams.get('edit') !== null

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { selectedCountry, setSelectedCountry } = useCountrySelector('LK')
  const { selectedCountry: selectedWhatsAppCountry, setSelectedCountry: setSelectedWhatsAppCountry } = useCountrySelector('LK')
  const [aiLoading, setAiLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Check authentication status and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // Pass the redirect URL directly in the URL parameters
      router.push('/?auth=true&redirect=/post')
    }
  }, [user, authLoading, router])

  // Load existing listing data when editing
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId && user && !authLoading) {
      const loadListingForEdit = async () => {
        try {
          const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', editId)
            .eq('user_id', user.id)  // Ensure user owns the listing
            .single()

          if (error || !listing) {
            console.error('Error loading listing for edit:', error)
            showError('Listing not found or you do not have permission to edit it')
            router.push('/profile')
            return
          }

          // Transform the database listing to form data
          const editFormData: FormData = {
            // Basic information
            vehicleType: (listing.vehicle_type as VehicleType) || '',
            make: listing.make || '',
            model: listing.model || '',
            year: listing.year?.toString() || '',
            price: listing.price?.toString() || '',

            // Vehicle details
            mileage: listing.mileage?.toString() || '',
            condition: listing.condition || 'Used',
            fuelType: listing.fuel_type || '',
            transmission: listing.transmission || '',
            engineCapacity: listing.engine_capacity?.toString() || '',
            color: listing.color || '',

            // Additional details
            interiorColor: listing.interior_color || '',
            registrationYear: listing.registration_year?.toString() || '',
            vehicleConditionDetails: listing.vehicle_condition_details || '',
            previousOwners: listing.previous_owners?.toString() || '',
            includingFinanceCompanies: listing.including_finance_companies || false,
            serviceRecordsAvailable: listing.service_records_available || false,
            trim: listing.trim || listing.grade || '',
            grade: listing.grade || '',

            // Pricing and finance
            pricingType: listing.pricing_type as PricingType || 'cash',
            negotiable: listing.negotiable || false,
            financeType: listing.finance_type || '',
            financeProvider: listing.finance_provider || '',
            originalAmount: listing.original_amount?.toString() || '',
            outstandingBalance: listing.outstanding_balance?.toString() || '',
            monthlyPayment: listing.monthly_payment?.toString() || '',
            remainingTerm: listing.remaining_term || '',
            earlySettlement: listing.early_settlement || '',

            // Description and location
            title: listing.title || '',
            description: listing.description || listing.details || '',
            city: listing.city || '',
            district: listing.district || '',

            // Contact information
            phone: listing.phone || '',
            whatsapp: listing.whatsapp || '',
            email: listing.email || '',

            // Form-specific fields
            images: [],
            imageUrls: [],
            aiStyle: 'professional' as AIStyle,
            whatsappSameAsPhone: listing.whatsapp === listing.phone,
            preferredContact: 'phone' as 'phone' | 'whatsapp' | 'email',
            bestTimeToCall: 'anytime',
            showVehicleDropdown: false
          }

          // Set the form data
          setFormData(editFormData)

          // Set location dropdowns
          if (listing.district) {
            setSelectedDistrict(listing.district)
            const district = getDistrictByName(listing.district)
            if (district) {
              const cities = getCitiesByDistrictId(district.id)
              setAvailableCities(cities.map(c => c.name))
            }
          }

          // Load existing images
          if (listing.images) {
            let imageUrls: string[] = []

            if (Array.isArray(listing.images)) {
              imageUrls = listing.images
            } else if (typeof listing.images === 'object' && listing.images.urls) {
              imageUrls = listing.images.urls
            } else if (listing.image_urls) {
              imageUrls = listing.image_urls
            } else if (listing.primary_image_url) {
              imageUrls = [listing.primary_image_url]
            }

            if (imageUrls.length > 0) {
              setImagePreviews(imageUrls)
              setFormData(prev => ({
                ...prev,
                imageUrls: imageUrls,
                images: [] // Existing images are URLs, not files
              }))
            }
          }

          console.log('Loaded listing for edit:', listing)
          console.log('Form data populated:', editFormData)

        } catch (error) {
          console.error('Error loading listing for edit:', error)
          showError('Failed to load listing data')
          router.push('/profile')
        }
      }

      loadListingForEdit()
    }
  }, [searchParams, user, authLoading, router, showError])

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-populate phone numbers from user profile
  useEffect(() => {
    if (!profileLoading && profile && !formData.phone && !formData.whatsapp) {
      const phoneNumber = getPhoneNumber()
      const whatsappNumber = getWhatsAppNumber()
      
      if (phoneNumber || whatsappNumber) {
        setFormData(prev => ({
          ...prev,
          phone: phoneNumber,
          whatsapp: whatsappNumber,
          email: profile.email || prev.email
        }))
      }
    }
  }, [profile, profileLoading, getPhoneNumber, getWhatsAppNumber])
  
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

  // Handle page visibility changes (mobile backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && loading) {
        // Save state when page is backgrounded during submission
        console.log('Page backgrounded during submission - saving state')
        localStorage.setItem('publishInterrupted', JSON.stringify({
          formData,
          timestamp: Date.now()
        }))
      } else if (!document.hidden) {
        // Check for interrupted publish when page becomes visible
        const interrupted = localStorage.getItem('publishInterrupted')
        if (interrupted) {
          try {
            const { timestamp } = JSON.parse(interrupted)
            // If less than 5 minutes ago, show recovery option
            if (Date.now() - timestamp < 5 * 60 * 1000) {
              const lastError = localStorage.getItem('lastPublishError')
              if (lastError) {
                const { message } = JSON.parse(lastError)
                showError(`Previous publish may have failed: ${message}. Please try again.`, {
                  duration: 10000,
                  persistent: true
                })
              }
            }
          } catch (e) {
            console.error('Error checking interrupted publish:', e)
          }
          localStorage.removeItem('publishInterrupted')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading, formData])

  // Update WhatsApp when phone changes
  useEffect(() => {
    if (formData.whatsappSameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }))
      setSelectedWhatsAppCountry(selectedCountry) // Sync country code too
    }
  }, [formData.phone, formData.whatsappSameAsPhone, selectedCountry])
  
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
      
      // Mileage is not applicable for bicycles
      if (formData.vehicleType !== 'bicycle' && !formData.mileage) {
        newErrors.mileage = 'Mileage is required'
      }
      
      if (!formData.condition) newErrors.condition = 'Vehicle condition is required'
      
      // Trim/grade is mainly for cars and some vans
      if (['car'].includes(formData.vehicleType) && !formData.trim) {
        newErrors.trim = 'Trim/grade is required'
      }
      
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

      // Special handling for description field - expand and focus the generator
      if (firstErrorField === 'description') {
        setTimeout(() => {
          descriptionGeneratorRef.current?.expandAndFocus()
        }, 100)
      } else {
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
  
  // Helper to validate image file
  const isValidImageFile = (file: File): boolean => {
    // Check file type if available
    if (file.type && file.type.startsWith('image/')) {
      return true
    }

    // Fallback to file extension check if type is missing
    const ext = file.name?.toLowerCase().split('.').pop()
    return ext ? ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(ext) : false
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const allFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    let hasInvalidFiles = false

    for (const file of allFiles) {
      if (!isValidImageFile(file)) {
        hasInvalidFiles = true
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        showError(`Image "${file.name}" exceeds 10MB`, { duration: 5000 })
        continue
      }

      validFiles.push(file)
    }

    if (hasInvalidFiles) {
      showError('Some files were not images and were skipped. Allowed types: JPG, JPEG, PNG, WebP, AVIF', { duration: 5000 })
    }

    const files = validFiles

    if (files.length + formData.images.length > 15) {
      showError('Maximum 15 images allowed', { duration: 5000 })
      return
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || [])
    const validFiles: File[] = []
    let hasInvalidFiles = false

    for (const file of allFiles) {
      if (!isValidImageFile(file)) {
        hasInvalidFiles = true
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        showError(`Image "${file.name}" exceeds 10MB`, { duration: 5000 })
        continue
      }

      validFiles.push(file)
    }

    if (hasInvalidFiles) {
      showError('Some files were not images and were skipped. Allowed types: JPG, JPEG, PNG, WebP, AVIF', { duration: 5000 })
    }

    const files = validFiles

    if (files.length + formData.images.length > 15) {
      showError('Maximum 15 images allowed', { duration: 5000 })
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
      showError('Please fill in make, model, and year first', { duration: 5000 })
      return
    }

    setAiLoading(true)
    try {
      // Get reCAPTCHA token before making the request
      const recaptchaToken = await getAIToken()

      const response = await fetch('/api/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          mileage: formData.mileage,
          trim: formData.trim,
          registrationYear: formData.registrationYear,
          previousOwners: formData.previousOwners,
          interiorColor: formData.interiorColor,
          vehicleConditionDetails: formData.vehicleConditionDetails,
          serviceRecordsAvailable: formData.serviceRecordsAvailable,
          includingFinanceCompanies: formData.includingFinanceCompanies,
          style: formData.aiStyle,
          recaptchaToken
        }),
      })

      const data = await response.json()
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }))
      }
    } catch (error) {
      showError('Error generating description. Please try again.', { duration: 5000 })
    } finally {
      setAiLoading(false)
    }
  }
  
  const uploadImages = async (images: File[], userId: string): Promise<string[]> => {
    try {
      // Create FormData with all images
      const formData = new FormData()
      images.forEach(image => {
        formData.append('images', image)
      })
      formData.append('listingId', userId) // Use userId as temporary listingId

      console.log('Uploading images to Cloudinary...', images.length)

      // Upload to Cloudinary
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData // Send as FormData, not JSON
      })

      const result = await response.json()

      if (result.success && result.images) {
        const urls = result.images.map((img: any) => img.url)
        console.log('Images uploaded to Cloudinary:', urls)
        return urls
      } else {
        console.error('Cloudinary upload failed:', result.error)
        showError(`Upload failed: ${result.error || 'Unknown error'}`)
        return []
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      showError('Error uploading images')
      return []
    }
  }
  
  // Helper: Timeout wrapper for promises
  const withTimeout = <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      )
    ])
  }

  // Helper: Retry with exponential backoff
  const retryWithBackoff = async <T,>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    shouldRetry: (error: any) => boolean = () => true
  ): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1
        const isRetryable = shouldRetry(error)

        if (isLastAttempt || !isRetryable) {
          throw error
        }

        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('Max retries exceeded')
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setLoading(true)

    // Save state in case page is backgrounded
    localStorage.setItem('publishInProgress', JSON.stringify({
      formData,
      timestamp: Date.now()
    }))

    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        showError('Please log in to post a listing')
        router.push('/login')
        return
      }

      // Upload images with timeout and existing URLs
      let imageUrls: string[] = [...formData.imageUrls]

      if (formData.images.length > 0) {
        console.log('Uploading images...')

        try {
          const uploadedUrls = await withTimeout(
            retryWithBackoff(
              () => uploadImages(formData.images, user.id),
              2, // Max 2 retries for uploads
              2000, // 2 second base delay
              (error) => {
                // Only retry on network errors, not validation errors
                return error?.message?.includes('timeout') ||
                       error?.message?.includes('network') ||
                       error?.message?.includes('fetch')
              }
            ),
            120000, // 120 second timeout for uploads
            'Image upload'
          )

          imageUrls = [...imageUrls, ...uploadedUrls]
          console.log('Images uploaded:', uploadedUrls)
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError)

          if (uploadError.message?.includes('timeout')) {
            showError('Image upload timed out. Please check your connection and try again with fewer images.', {
              duration: 10000,
              persistent: true
            })
          } else if (uploadError.message?.includes('Rate limit')) {
            showError('Upload limit reached. Please wait a few minutes and try again.', {
              duration: 10000,
              persistent: true
            })
          } else {
            showError(`Image upload failed: ${uploadError.message}`, {
              duration: 10000,
              persistent: true
            })
          }
          return
        }
      }

      // Prepare the listing data according to the database schema
      const listingData: any = {
        title: formData.title,
        description: formData.description,
        details: formData.description,
        price: formData.pricingType === 'finance'
          ? (parseFloat(formData.askingPrice || '') || parseFloat(formData.outstandingBalance || '') || parseFloat(formData.price || ''))
          : parseFloat(formData.price || ''),
        negotiable: formData.negotiable,
        make: formData.make === 'Other' ? (formData.customMake || 'Other') : formData.make,
        customMake: formData.customMake,
        model: formData.model === 'Other' ? (formData.customModel || 'Other') : (formData.model || ''),
        customModel: formData.customModel,
        year: parseInt(formData.year || ''),
        mileage: parseInt(formData.mileage || '') || null,
        fuel_type: formData.fuelType || null,
        transmission: formData.transmission || null,
        body_type: formData.vehicleType || null,
        vehicle_type: formData.vehicleType || null,
        color: formData.color || null,
        condition: formData.condition || null,
        engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
        location: `${formData.city}, ${formData.district}`,
        city: formData.city,
        district: formData.district,
        image_urls: imageUrls,
        image_url: imageUrls[0] || null,
        phone: formatPhoneDisplay(formData.phone, selectedCountry.dialCode),
        whatsapp: formatPhoneDisplay(formData.whatsapp || formData.phone, formData.whatsappSameAsPhone ? selectedCountry.dialCode : selectedWhatsAppCountry.dialCode),
        email: formData.email,
        pricing_type: formData.pricingType,
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
          ? parseFloat(formData.askingPrice) : null,
        interior_color: formData.interiorColor || null,
        registration_year: formData.registrationYear ? parseInt(formData.registrationYear) : null,
        vehicle_condition_details: formData.vehicleConditionDetails || null,
        previous_owners: formData.previousOwners ? parseInt(formData.previousOwners) : null,
        including_finance_companies: formData.includingFinanceCompanies || false,
        service_records_available: formData.serviceRecordsAvailable || false,
        trim: formData.trim || null,
        grade: formData.grade || null,
      }

      console.log('Submitting listing data:', listingData)

      // Check if we're in edit mode
      const editId = searchParams.get('edit')

      if (editId) {
        // Update existing listing (keep direct database access for edits)
        console.log('Updating existing listing:', editId)

        const updateData = { ...listingData }
        const now = new Date().toISOString()
        updateData.updated_at = now
        updateData.posted_date = now

        const result = await withTimeout(
          supabase
            .from('listings')
            .update(updateData)
            .eq('id', editId)
            .eq('user_id', user.id)
            .select()
            .single(),
          15000,
          'Database update'
        )

        if (result.error) {
          console.error('Supabase update error:', result.error)
          throw result.error
        }

        console.log('Listing updated successfully:', result.data)
        localStorage.removeItem('vehiclePostDraft')
        localStorage.removeItem('publishInProgress')
        router.push('/profile?updated=true')

      } else {
        // Create new listing using API endpoint
        console.log('Creating new listing via API')

        const response = await withTimeout(
          retryWithBackoff(
            async () => {
              const res = await fetch('/api/listings/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  listing: listingData,
                  imageUrls: imageUrls
                }),
              })

              if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || `HTTP ${res.status}`)
              }

              return res
            },
            2, // Max 2 retries
            1000, // 1 second base delay
            (error) => {
              // Retry on network/timeout errors, not on validation/auth errors
              const message = error?.message || ''
              return message.includes('timeout') ||
                     message.includes('network') ||
                     message.includes('fetch') ||
                     message.includes('500') ||
                     message.includes('502') ||
                     message.includes('503')
            }
          ),
          20000, // 20 second timeout
          'Listing creation'
        )

        const result = await response.json()

        if (!result.success) {
          console.error('API error:', result)

          // Use error codes for specific handling
          if (result.code === 'AUTH_REQUIRED') {
            showError('Your session expired. Please log in again.', {
              duration: 10000,
              persistent: true
            })
            router.push('/login')
            return
          } else if (result.code === 'RLS_ERROR') {
            showError('Permission error. Please try logging out and back in.', {
              duration: 10000,
              persistent: true
            })
          } else if (result.code === 'VALIDATION_ERROR') {
            showError(`Validation error: ${result.error}`, {
              duration: 10000,
              persistent: true
            })
          } else {
            showError(result.error || 'Failed to create listing. Please try again.', {
              duration: 10000,
              persistent: true
            })
          }
          return
        }

        console.log('Listing created successfully:', result.listing)
        localStorage.removeItem('vehiclePostDraft')
        localStorage.removeItem('publishInProgress')
        router.push(`/post/paid-features?new=true&listing_id=${result.listing.id}`)
      }
    } catch (error: any) {
      console.error('Error posting vehicle:', error)

      // Categorize and display errors appropriately
      let errorMessage = 'Error posting vehicle. Please try again.'
      let retryable = true

      if (error?.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.'
        } else if (error.message.includes('user_id') || error.code === '42501') {
          errorMessage = 'Permission denied. Please try logging out and back in.'
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'A similar listing already exists'
          retryable = false
        } else if (error.message.includes('violates')) {
          errorMessage = 'Please check all required fields are filled correctly'
          retryable = false
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      showError(errorMessage, {
        duration: 10000,
        persistent: true
      })

      // Store error for debugging
      localStorage.setItem('lastPublishError', JSON.stringify({
        message: errorMessage,
        details: error?.message || '',
        timestamp: new Date().toISOString(),
        retryable
      }))

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
              {isEditMode ? 'Contact & Update' : 'Contact & Publish'}
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
              {currentStep === 3 && (isEditMode ? 'Contact & Update' : 'Contact & Publish')}
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
                  Photos <span className="text-red-500">*</span>
                </h2>
                <p className="text-gray-500 text-sm">Upload high-quality images of your vehicle (at least 1 photo required)</p>
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
                    At least 1 photo required. Maximum 15 photos, up to 10MB each. JPG, PNG formats.
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

              {/* Description Generator with breathing effect */}
              <DescriptionGenerator
                ref={descriptionGeneratorRef}
                formData={formData}
                setFormData={setFormData}
                onGenerate={generateAIDescription}
                aiLoading={aiLoading}
                errors={errors}
              />
            </div>
          )}
          
          {/* Step 3: Contact & Publish/Update */}
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
                    <div className="flex">
                      <CountrySelector
                        selectedCountry={selectedCountry}
                        onCountrySelect={setSelectedCountry}
                        className="w-32"
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        className={`flex-1 px-4 py-3 h-[50px] border border-l-0 rounded-r-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none ${
                          errors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    </div>
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
                    <div className="flex">
                      <CountrySelector
                        selectedCountry={selectedWhatsAppCountry}
                        onCountrySelect={setSelectedWhatsAppCountry}
                        className="w-32"
                        disabled={formData.whatsappSameAsPhone}
                      />
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="Enter WhatsApp number"
                        disabled={formData.whatsappSameAsPhone}
                        className={`flex-1 px-4 py-3 h-[50px] border border-l-0 rounded-r-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:outline-none ${
                          formData.whatsappSameAsPhone ? 'bg-gray-50' : ''
                        } ${errors.whatsapp ? 'border-red-300' : 'border-gray-300'}`}
                      />
                    </div>
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
                  <p><strong className="text-gray-900">
                    {formData.pricingType === 'finance' ? 'Asking Price:' : 'Price:'}
                  </strong> Rs. {
                    formData.pricingType === 'finance' 
                      ? (formData.askingPrice ? parseFloat(formData.askingPrice).toLocaleString() : '0')
                      : (formData.price ? parseFloat(formData.price).toLocaleString() : '0')
                  }</p>
                  <p><strong className="text-gray-900">Location:</strong> {formData.city}, {formData.district}</p>
                  <p><strong className="text-gray-900">Photos:</strong> {formData.images.length + formData.imageUrls.length} uploaded</p>
                  {formData.previousOwners && (
                    <p><strong className="text-gray-900">Previous Owners:</strong> {formData.previousOwners}{formData.includingFinanceCompanies ? ' (including finance companies)' : ''}</p>
                  )}
                  {formData.serviceRecordsAvailable && (
                    <p><strong className="text-gray-900">Service Records:</strong> Available</p>
                  )}
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
                  {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Listing' : 'Publish Listing')}
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
                  {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Listing' : 'Publish Listing')}
                </button>
              )}
              </div>
            </div>
          </div>
        </div>
        
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
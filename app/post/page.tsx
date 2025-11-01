'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import {
  Car, Camera, MapPin, Phone, CreditCard, CheckCircle,
  AlertCircle, Upload, X, Sparkles, ChevronRight,
  FileText, User, Image as ImageIcon, Star
} from 'lucide-react'
import CountrySelector, { useCountrySelector } from '@/app/components/CountrySelector'
import { formatPhoneForStorage, formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
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
import { BaseVehicleFormData } from '@/app/components/vehicle-forms/types'
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'

// Lazy load form components (Phase 2 optimization)
import type { DescriptionGeneratorRef } from '@/app/components/vehicle-forms/DescriptionGenerator'
const DescriptionGenerator = dynamic(() => import('@/app/components/vehicle-forms/DescriptionGenerator'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-32"></div>
})
const VehicleFormFactory = dynamic(() => import('@/app/components/vehicle-forms/VehicleFormFactory'), {
  loading: () => <div className="animate-pulse bg-gray-100 rounded-lg p-4 h-64"></div>
})

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
  outstandingBalance: '',
  monthlyPayment: '',
  remainingTerm: '',
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
  const { toasts, showError, showSuccess, showWarning, showInfo, removeToast } = useToast()
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
  const [editDataLoading, setEditDataLoading] = useState(false)
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
          // Set loading state
          setEditDataLoading(true)
          // Clear any existing errors when entering edit mode
          setErrors({})

          const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', editId)
            .eq('user_id', user.id)  // Ensure user owns the listing
            .single()

          if (error || !listing) {
            console.error('Error loading listing for edit:', error)
            showError('Listing not found or you do not have permission to edit it')
            setEditDataLoading(false)
            router.push('/profile')
            return
          }

          // Transform the database listing to form data
          // Database only has 'grade' column, not 'trim'
          const gradeValue = listing.grade || ''
          // Ensure make and model are properly set
          const make = listing.make?.trim() || ''
          const model = listing.model?.trim() || ''

          const editFormData: FormData = {
            // Basic information
            vehicleType: (listing.vehicle_type as VehicleType) || '',
            make: make,
            model: model,
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
            serviceRecordsAvailable: listing.service_records_available || false,
            trim: gradeValue,  // Use grade value for trim field (DB only has grade column)
            grade: gradeValue,

            // Pricing and finance
            pricingType: listing.pricing_type as PricingType || 'cash',
            negotiable: listing.negotiable || false,
            financeType: listing.finance_type || '',
            outstandingBalance: listing.outstanding_balance?.toString() || '',
            monthlyPayment: listing.monthly_payment?.toString() || '',
            remainingTerm: listing.remaining_term || '',

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

          // Set flag BEFORE setFormData to prevent vehicle type useEffect from clearing make/model
          editDataLoadedRef.current = true

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

          // Load existing images (prioritize image_urls over images)
          let imageUrls: string[] = []

          // Check image_urls first (actual storage location)
          if (listing.image_urls && Array.isArray(listing.image_urls) && listing.image_urls.length > 0) {
            imageUrls = listing.image_urls
          }
          // Fallback to images array if it has data
          else if (Array.isArray(listing.images) && listing.images.length > 0) {
            imageUrls = listing.images
          }
          // Check nested object structure
          else if (typeof listing.images === 'object' && listing.images?.urls && listing.images.urls.length > 0) {
            imageUrls = listing.images.urls
          }
          // Last resort: primary_image_url
          else if (listing.primary_image_url) {
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

          // Mark edit data as loaded
          setEditDataLoading(false)

        } catch (error) {
          console.error('Error loading listing for edit:', error)
          showError('Failed to load listing data')
          setEditDataLoading(false)
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
  
  // Load draft from localStorage (skip in edit mode to avoid overwriting preloaded values like trim/grade)
  useEffect(() => {
    if (isEditMode) return
    const draft = localStorage.getItem('vehiclePostDraft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData({ ...initialFormData, ...parsed })
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [isEditMode])
  
  // Auto-save draft (skip in edit mode to avoid overwriting)
  useEffect(() => {
    if (isEditMode) return

    const timer = setTimeout(() => {
      localStorage.setItem('vehiclePostDraft', JSON.stringify(formData))
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData, isEditMode])
  
  // Update WhatsApp when phone changes
  useEffect(() => {
    if (formData.whatsappSameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }))
      setSelectedWhatsAppCountry(selectedCountry) // Sync country code too
    }
  }, [formData.phone, formData.whatsappSameAsPhone, selectedCountry])
  
  // Clear make and model only when the user changes vehicle type (not on initial edit load)
  const prevVehicleTypeRef = useRef<string | undefined>(undefined)
  const editDataLoadedRef = useRef(false)

  useEffect(() => {
    // Skip clearing if we're in edit mode and data just loaded
    if (editDataLoadedRef.current) {
      editDataLoadedRef.current = false
      prevVehicleTypeRef.current = formData.vehicleType as string
      return
    }

    // Skip clearing on the very first effect run (initialization)
    if (prevVehicleTypeRef.current === undefined) {
      prevVehicleTypeRef.current = formData.vehicleType as string
      return
    }

    // If vehicle type actually changed after initialization, clear dependent fields
    if (prevVehicleTypeRef.current !== formData.vehicleType) {
      prevVehicleTypeRef.current = formData.vehicleType as string
      setFormData(prev => ({ ...prev, make: '', model: '' }))
    }
  }, [formData.vehicleType])
  
  // Generate image preview URLs (prefer newly selected files; fallback to existing URLs when editing)
  useEffect(() => {
    // Only run on client side after component is mounted
    if (!mounted) return

    // If there are newly selected files, build previews from them
    if (formData.images && formData.images.length > 0) {
      try {
        const previews = formData.images
          .map(file => (file instanceof File ? URL.createObjectURL(file) : ''))
          .filter(url => url !== '')

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
      return
    }

    // No new files selected: show existing image URLs (edit mode)
    if (Array.isArray(formData.imageUrls) && formData.imageUrls.length > 0) {
      setImagePreviews(formData.imageUrls)
    } else {
      setImagePreviews([])
    }
  }, [formData.images, formData.imageUrls, mounted])

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
    // Don't allow navigation if edit data is still loading
    if (editDataLoading) {
      showWarning('Please wait while we load your listing data...')
      return
    }

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
    
    const allFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []

    for (const file of allFiles) {
      if (!file.type.startsWith('image/')) continue

      if (file.size > 10 * 1024 * 1024) {
        showError('Image exceeds 10MB')
        continue
      }

      validFiles.push(file)
    }

    const files = validFiles
    
    if (files.length + formData.images.length > 15) {
      showError('Maximum 15 images allowed', 3000)
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']

    for (const file of allFiles) {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        showError(`Invalid file type: ${file.name}. Allowed: JPEG, JPG, PNG, TIFF, WebP`)
        continue
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showError(`Image exceeds 10MB: ${file.name}`)
        continue
      }

      validFiles.push(file)
    }

    const files = validFiles
    
    if (files.length + formData.images.length > 15) {
      showError('Maximum 15 images allowed', 3000)
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
  }
  
  const removeImage = (index: number) => {
    // In edit mode, images are URLs; in create mode, images are File objects
    if (formData.imageUrls && formData.imageUrls.length > 0) {
      // Edit mode: remove from imageUrls
      setFormData(prev => ({
        ...prev,
        imageUrls: prev.imageUrls?.filter((_, i) => i !== index) || []
      }))
    } else {
      // Create mode: remove from images (File objects)
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
    }
  }
  
  const generateAIDescription = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      showWarning('Please fill in make, model, and year first', 3000)
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
          make: formData.make === 'Other' ? formData.customMake : formData.make,
          model: formData.model === 'Other' ? formData.customModel : formData.model,
          year: formData.year,
          mileage: formData.mileage,
          trim: formData.trim,
          registrationYear: formData.registrationYear,
          previousOwners: formData.previousOwners,
          interiorColor: formData.interiorColor,
          vehicleConditionDetails: formData.vehicleConditionDetails,
          serviceRecordsAvailable: formData.serviceRecordsAvailable,
          style: formData.aiStyle,
          recaptchaToken
        }),
      })
      
      const data = await response.json()
      if (data.description) {
        setFormData(prev => ({ ...prev, description: data.description }))
        showSuccess('Description generated successfully!', 3000)
      }
    } catch (error) {
      showError('Failed to generate description. Please try again.', 4000)
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
  
  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    setLoading(true)
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push('/')
        return
      }

      // Upload images first if any exist
      let imageUrls: string[] = []
      if (formData.images.length > 0) {
        console.log('Uploading images...')
        showInfo('Uploading images...', 2000)
        imageUrls = await uploadImages(formData.images, user.id)
        if (imageUrls.length > 0) {
          showSuccess(`${imageUrls.length} image(s) uploaded successfully`, 3000)
        }
        console.log('Images uploaded:', imageUrls)
      }

      // Prepare the listing data according to the database schema
      const listingData: any = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        details: formData.description, // Using description for details as well
        price: formData.pricingType === 'finance' 
          ? (parseFloat(formData.askingPrice || '') || parseFloat(formData.outstandingBalance || '') || parseFloat(formData.price || ''))
          : parseFloat(formData.price || ''),
        negotiable: formData.negotiable,
        make: formData.make === 'Other' ? (formData.customMake || 'Other') : formData.make,
        model: formData.model === 'Other' ? (formData.customModel || 'Other') : (formData.model || ''),
        year: parseInt(formData.year || ''),
        mileage: parseInt(formData.mileage || '') || null,
        fuel_type: formData.fuelType || null,
        transmission: formData.transmission || null,
        body_type: formData.vehicleType || null,
        vehicle_type: formData.vehicleType || null,
        color: formData.color || null,
        engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
        grade: formData.trim || formData.grade || null, // Database uses 'grade' column
        location: `${formData.city}, ${formData.district}`,
        city: formData.city,
        district: formData.district,
        image_urls: imageUrls, // This is the array of all images
        image_url: imageUrls[0] || null, // This is the primary image
        status: 'pending', // New listings start as pending
        // Contact information
        phone: formatPhoneDisplay(formData.phone, selectedCountry.dialCode),
        whatsapp: formatPhoneDisplay(formData.whatsapp || formData.phone, formData.whatsappSameAsPhone ? selectedCountry.dialCode : selectedWhatsAppCountry.dialCode),
        email: formData.email,
        // Finance information
        pricing_type: formData.pricingType,
        finance_type: formData.pricingType === 'finance' ? formData.financeType : null,
        outstanding_balance: formData.pricingType === 'finance' && formData.outstandingBalance 
          ? parseFloat(formData.outstandingBalance) : null,
        monthly_payment: formData.pricingType === 'finance' && formData.monthlyPayment 
          ? parseFloat(formData.monthlyPayment) : null,
        remaining_term: formData.pricingType === 'finance' ? formData.remainingTerm : null,
        asking_price: formData.pricingType === 'finance' && formData.askingPrice
          ? parseFloat(formData.askingPrice) : null,
        // Additional information
        interior_color: formData.interiorColor || null,
        registration_year: formData.registrationYear ? parseInt(formData.registrationYear) : null,
        vehicle_condition_details: formData.vehicleConditionDetails || null,
        previous_owners: formData.previousOwners ? parseInt(formData.previousOwners) : null,
        service_records_available: formData.serviceRecordsAvailable || false,
        // Promotion flags
        is_featured: false,
        is_top_spot: false,
        is_boosted: false,
        is_urgent: false
      }

      console.log('Submitting listing data:', listingData)

      // Validate required fields before submitting
      const requiredFields = {
        user_id: listingData.user_id,
        title: listingData.title,
        price: listingData.price
      }

      console.log('Required fields check:', requiredFields)

      // Check for any undefined or null values that could cause constraint violations
      Object.entries(listingData).forEach(([key, value]) => {
        if (value === undefined) {
          console.warn(`Field ${key} is undefined - this may cause database issues`)
        }
      })

      // Check if we're in edit mode
      const editId = searchParams.get('edit')
      let data, error

      if (editId) {
        // Update existing listing
        console.log('Updating existing listing:', editId)

        // Don't change the status when updating - preserve existing status
        const updateData = { ...listingData }
        delete updateData.status
        delete updateData.user_id // Don't update user_id

        // Update modified timestamp and posted date to move to top of listings
        const now = new Date().toISOString()
        updateData.updated_at = now
        updateData.posted_date = now // Move to top of browse listings

        const result = await supabase
          .from('listings')
          .update(updateData)
          .eq('id', editId)
          .eq('user_id', user.id) // Ensure user owns the listing
          .select()
          .single()

        data = result.data
        error = result.error

        if (error) {
          console.error('Supabase update error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        console.log('Listing updated successfully:', data)

        localStorage.removeItem('vehiclePostDraft')
        showSuccess('Listing updated successfully!', 2000)
        // Redirect back to profile with success message
        setTimeout(() => router.push('/profile?updated=true'), 1000)

      } else {
        // Create new listing
        console.log('Creating new listing')

        const result = await supabase
          .from('listings')
          .insert([listingData])
          .select()
          .single()

        data = result.data
        error = result.error

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }

        console.log('Listing created successfully:', data)

        localStorage.removeItem('vehiclePostDraft')
        showSuccess('Listing created successfully! Redirecting...', 2000)
        // Redirect to paid features page with success message
        setTimeout(() => router.push(`/post/paid-features?new=true&listing_id=${data.id}`), 1000)
      }
    } catch (error: any) {
      console.error('Error posting vehicle:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Error posting vehicle. Please try again.'

      if (error?.message) {
        if (error.message.includes('user_id')) {
          errorMessage = 'Please log in to post a listing'
        } else if (error.message.includes('duplicate')) {
          errorMessage = 'A similar listing already exists'
        } else if (error.message.includes('violates')) {
          errorMessage = 'Please check all required fields are filled correctly'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection.'
        } else if (error.message.includes('42501') || error.message.includes('policy')) {
          errorMessage = 'Permission denied. Please try logging out and back in.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      showError(errorMessage, 5000)
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
    <div className="min-h-screen bg-gray-50 lg:py-8">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-4 lg:mb-8 py-4 lg:py-0 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 border-b lg:border-0">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">Sell Your Vehicle</h1>
          <p className="text-sm lg:text-base text-gray-600">Reach thousands of potential buyers across Sri Lanka</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 lg:mb-8 py-4 lg:py-0 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 border-b lg:border-0">
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
        <div className="relative overflow-hidden lg:rounded-lg p-4 mb-4 lg:mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 -mx-4 lg:mx-0 border-b lg:border border-purple-200">
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
        <div className="lg:bg-white lg:rounded-xl lg:shadow-sm lg:p-8">
          {/* Step 1: Vehicle Details */}
          {currentStep === 1 && (
            <div className="space-y-4 lg:space-y-8">
              {/* Vehicle Type Section */}
              <div className="vehicle-type-section bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 py-6 lg:py-0 border-b lg:border-0">
                <div className="lg:pb-6 mb-4 lg:mb-8">
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
                    accept="image/jpeg,image/jpg,image/png,image/tiff,image/webp"
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
                    At least 1 photo required. Maximum 15 photos, up to 10MB each. Formats: JPEG, JPG, PNG, TIFF, WebP.
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
                  <p><strong className="text-gray-900">Vehicle:</strong> {formData.year} {formData.make === 'Other' ? formData.customMake : formData.make} {formData.model === 'Other' ? formData.customModel : formData.model}</p>
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
                    <p><strong className="text-gray-900">Previous Owners:</strong> {formData.previousOwners}</p>
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
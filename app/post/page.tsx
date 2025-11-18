'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import {
  Car, Camera, MapPin, Phone, CreditCard, CheckCircle,
  AlertCircle, Upload, X, Sparkles, ChevronRight,
  FileText, User, Image as ImageIcon, Star, Edit
} from 'lucide-react'
import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
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
import { useToast } from '@/app/components/notifications/useToast'
import { ToastContainer } from '@/app/components/notifications/ToastContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { compressImageFile } from '@/lib/utils/image-compression'
import { logger } from '@/lib/utils/logger'
import { buildListingDescription } from '@/lib/services/descriptionBuilder'
import EditPhoneModal from '@/app/components/EditPhoneModal'

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

type UploadStatusState = {
  progress: number
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error'
  message?: string
}

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
  fuelType: '',
  transmission: '',
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
  const { toasts, showError, showSuccess, showWarning, showInfo, removeToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const vehicleDropdownRef = useRef<HTMLDivElement>(null)
  const descriptionGeneratorRef = useRef<DescriptionGeneratorRef>(null)

  // Phone verification modals
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false)
  const [showEditWhatsAppModal, setShowEditWhatsAppModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingPhone, setPendingPhone] = useState<string>('')
  const [pendingOtpCode, setPendingOtpCode] = useState<string>('')

  // Detect edit mode
  const isEditMode = searchParams.get('edit') !== null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [editDataLoading, setEditDataLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatusState>>({})
  const uploadIdMapRef = useRef<Map<File, string>>(new Map())
  const activeUploadsRef = useRef(0)
  const [imagesUploading, setImagesUploading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<Array<{ url: string; type: 'local' | 'remote'; file?: File }>>([])
  const [mounted, setMounted] = useState(false)
  const [originalPhone, setOriginalPhone] = useState<string>('')
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false)
  const profileDataPopulatedRef = useRef(false)
  
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

            // Additional details
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

          // Store original phone for comparison
          if (listing.phone) {
            setOriginalPhone(listing.phone)
            setPhoneVerified(true)
          }

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
            setImagePreviews(imageUrls.map(url => ({ url, type: 'remote' as const })))
            setFormData(prev => ({
              ...prev,
              imageUrls: imageUrls,
              images: [] // Existing images are URLs, not files
            }))
          }

          // Mark edit data as loaded
          setEditDataLoading(false)

        } catch (error) {
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
    // Only populate once, and only if not in edit mode
    if (!profileLoading && profile && !isEditMode && !profileDataPopulatedRef.current) {
      const phoneNumber = getPhoneNumber()
      const whatsappNumber = getWhatsAppNumber()

      if (phoneNumber || whatsappNumber) {
        const populatedPhone = phoneNumber || ''
        setFormData(prev => ({
          ...prev,
          phone: prev.phone || phoneNumber, // Only populate if empty
          whatsapp: prev.whatsapp || whatsappNumber, // Only populate if empty
          email: prev.email || profile.email || ''
        }))
        // Store original phone for comparison
        setOriginalPhone(populatedPhone)
        // Mark as populated to prevent re-triggering
        profileDataPopulatedRef.current = true
      }
    }
  }, [profile, profileLoading, isEditMode])

  // Reset population flag when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      profileDataPopulatedRef.current = false
    }
  }, [isEditMode])

  // Store original phone when form data changes (for edit mode)
  useEffect(() => {
    if (isEditMode && formData.phone && !originalPhone) {
      setOriginalPhone(formData.phone)
    }
  }, [isEditMode, formData.phone, originalPhone])
  
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
        // Don't restore images from draft (File objects can't be serialized)
        delete parsed.images
        delete parsed.imageUrls
        setFormData({ ...initialFormData, ...parsed })
      } catch (e) {
      }
    }
  }, [isEditMode])

  // Auto-save draft (skip in edit mode to avoid overwriting)
  useEffect(() => {
    if (isEditMode) return

    const timer = setTimeout(() => {
      // Don't save images to localStorage (File objects can't be serialized)
      const { images, imageUrls, ...draftData } = formData
      localStorage.setItem('vehiclePostDraft', JSON.stringify(draftData))
    }, 1000)

    return () => clearTimeout(timer)
  }, [formData, isEditMode])
  
  // Update WhatsApp when phone changes
  useEffect(() => {
    if (formData.whatsappSameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }))
    }
  }, [formData.phone, formData.whatsappSameAsPhone])
  
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
    if (!mounted) return

    const cleanupUrls: string[] = []
    const localPreviews: Array<{ url: string; type: 'local'; file: File }> = []

    if (Array.isArray(formData.images) && formData.images.length > 0) {
      formData.images.forEach(file => {
        if (file instanceof File) {
          const previewUrl = URL.createObjectURL(file)
          cleanupUrls.push(previewUrl)
          localPreviews.push({ url: previewUrl, type: 'local', file })
        }
      })
    }

    const remotePreviews: Array<{ url: string; type: 'remote'; file?: File }> =
      Array.isArray(formData.imageUrls)
        ? formData.imageUrls.map(url => ({ url, type: 'remote' as const }))
        : []

    setImagePreviews([...localPreviews, ...remotePreviews])

    return () => {
      cleanupUrls.forEach(url => URL.revokeObjectURL(url))
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
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Vehicle type and title
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required'
    if (!formData.title) newErrors.title = 'Title is required'

    // Make and model
    if (!formData.make) {
      newErrors.make = 'Make is required'
    } else if (formData.make === 'Other' && !formData.customMake) {
      newErrors.make = 'Custom make name is required'
    }
    if (!formData.model) {
      newErrors.model = 'Model is required'
    } else if (formData.model === 'Other' && !formData.customModel) {
      newErrors.model = 'Custom model name is required'
    }

    // Year
    if (!formData.year) newErrors.year = 'Year is required'

    // Mileage (not applicable for bicycles)
    if (formData.vehicleType !== 'bicycle' && !formData.mileage) {
      newErrors.mileage = 'Mileage is required'
    }

    // Condition
    if (!formData.condition) newErrors.condition = 'Vehicle condition is required'

    // Trim/grade (optional for all vehicles now)

    // Location
    if (!formData.district) newErrors.district = 'District is required'
    if (!formData.city) newErrors.city = 'City is required'

    // Pricing
    if (!formData.price) newErrors.price = 'Price is required'

    if (formData.pricingType === 'finance') {
      if (!formData.financeType) newErrors.financeType = 'Finance type is required'
      if (!formData.outstandingBalance) newErrors.outstandingBalance = 'Outstanding balance is required'
      if (!formData.askingPrice) newErrors.askingPrice = 'Asking price is required'
      if (!formData.monthlyPayment) newErrors.monthlyPayment = 'Monthly payment is required'
      if (!formData.remainingTerm) newErrors.remainingTerm = 'Remaining term is required'
    }

    // Images
    if (formData.images.length === 0 && formData.imageUrls.length === 0) {
      newErrors.images = 'At least one image is required'
    }

    // Description
    if (!formData.description) newErrors.description = 'Description is required'

    // Contact info
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    if (!formData.whatsapp && !formData.whatsappSameAsPhone) {
      newErrors.whatsapp = 'WhatsApp number is required'
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
  
const getUploadUserId = (): string => {
  if (user?.id) return user.id
  logger.warn(
    'Image upload attempted without an authenticated user. Falling back to temporary identifier.',
    {
      scope: 'post-page',
      action: 'getUploadUserId'
    }
  )
  return 'temp'
}

  const queueImageUploads = async (files: File[]) => {
    if (files.length === 0) return

    const uploadUserId = getUploadUserId()

    const parseUploadResponse = async (response: Response) => {
      try {
        return await response.clone().json()
      } catch (jsonError) {
        const rawBody = await response.text().catch(() => '')
        const trimmed = rawBody.trim()
        const statusLabel = response.status
          ? `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
          : 'status unknown'
        const looksLikeHtml = /<\s*?[a-z!\/][\s\S]*?>/i.test(trimmed)
        const displayMessage = trimmed.length === 0
          ? `Upload failed: server returned an empty response (${statusLabel}).`
          : (!looksLikeHtml && trimmed.length <= 200
              ? trimmed
              : `Upload failed: server returned an unreadable response (${statusLabel}).`)
        const error = new Error(displayMessage)
        ;(error as any).details = {
          status: response.status,
          statusText: response.statusText,
          rawBody: trimmed.slice(0, 500),
          parseError: jsonError instanceof Error ? jsonError.message : String(jsonError)
        }
        throw error
      }
    }

    for (const file of files) {
      if (!(file instanceof File)) continue

      const existingId = uploadIdMapRef.current.get(file)
      if (existingId && uploadStatus[existingId]?.status !== 'error') {
        // Already uploading or completed
        continue
      }

      if (existingId) {
        uploadIdMapRef.current.delete(file)
        setUploadStatus(prev => {
          const next = { ...prev }
          delete next[existingId]
          return next
        })
      }

      const uploadId = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
      uploadIdMapRef.current.set(file, uploadId)
      setUploadStatus(prev => ({
        ...prev,
        [uploadId]: { progress: 5, status: 'compressing' }
      }))

      activeUploadsRef.current += 1
      setImagesUploading(true)

      try {
        const compression = await compressImageFile(file, {
          maxWidth: 1920,
          maxHeight: 1440,
          targetSize: 200 * 1024,
          quality: 0.85,
          convertToWebP: true
        })

        setUploadStatus(prev => ({
          ...prev,
          [uploadId]: { progress: 40, status: 'uploading' }
        }))

        const payload = new FormData()
        payload.append('images', compression.file, compression.file.name)
        payload.append('listingId', uploadUserId)

        const response = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: payload
        })

        const result: any = await parseUploadResponse(response)

        if (!result || typeof result !== 'object') {
          const statusLabel = response.status
            ? `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
            : 'status unknown'
          throw new Error(`Upload failed: server returned a malformed payload (${statusLabel}).`)
        }

        if (response.ok && result.success && Array.isArray(result.images) && result.images.length > 0) {
          const uploadedImage = result.images[0]
          const preferredUrl =
            uploadedImage.mobile ||
            uploadedImage.thumbnail ||
            uploadedImage.secure_url ||
            uploadedImage.url

          if (!preferredUrl) {
            throw new Error('Upload response missing image URL')
          }

          uploadIdMapRef.current.delete(file)
          setUploadStatus(prev => {
            const next = { ...prev }
            delete next[uploadId]
            return next
          })

          setFormData(prev => {
            if (!prev.images.includes(file)) {
              return prev
            }
            return {
              ...prev,
              imageUrls: [...prev.imageUrls, preferredUrl],
              images: prev.images.filter(img => img !== file)
            }
          })
        } else {
          const errorMessage = result.error || 'Upload failed'
          setUploadStatus(prev => ({
            ...prev,
            [uploadId]: { progress: 100, status: 'error', message: errorMessage }
          }))
          showError(`Failed to upload ${file.name}: ${errorMessage}`, 5000)
        }
      } catch (error: any) {
        logger.error('Image upload failed', error as Error)
        setUploadStatus(prev => ({
          ...prev,
          [uploadId]: {
            progress: 100,
            status: 'error',
            message: error?.message || 'Upload failed'
          }
        }))
        showError(`Failed to upload ${file.name}: ${error?.message || 'Unknown error'}`, 5000)
      } finally {
        activeUploadsRef.current = Math.max(0, activeUploadsRef.current - 1)
        if (activeUploadsRef.current === 0) {
          setImagesUploading(false)
        }
      }
    }
  }

  const retryImageUpload = (file: File) => {
    void queueImageUploads([file])
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
    
    if (files.length + formData.images.length + formData.imageUrls.length > 10) {
      showError('Maximum 10 images allowed', 3000)
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
    void queueImageUploads(files)
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
    
    if (files.length + formData.images.length + formData.imageUrls.length > 10) {
      showError('Maximum 10 images allowed', 3000)
      return
    }
    
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }))
    void queueImageUploads(files)
  }
  
  const removeImage = (index: number) => {
    const localCount = formData.images.length

    if (index < localCount) {
      const fileToRemove = formData.images[index]
      if (fileToRemove instanceof File) {
        const uploadId = uploadIdMapRef.current.get(fileToRemove)
        if (uploadId) {
          setUploadStatus(prev => {
            const next = { ...prev }
            delete next[uploadId]
            return next
          })
          uploadIdMapRef.current.delete(fileToRemove)
        }
      }

      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }))
      return
    }

    const remoteIndex = index - localCount
    if (remoteIndex >= 0 && remoteIndex < formData.imageUrls.length) {
      setFormData(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== remoteIndex)
      }))
    }
  }
  
  const generateAIDescription = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      showWarning('Fill in make, model, and year first', 3000)
      return
    }

    const overallStart = performance.now()
    setAiLoading(true)

    try {
      const { description: normalizedDescription, linesCount } = buildListingDescription({
        title: formData.title,
        vehicleType: formData.vehicleType,
        make: formData.make,
        customMake: formData.customMake,
        model: formData.model,
        customModel: formData.customModel,
        trim: formData.trim,
        year: formData.year,
        mileage: formData.mileage,
        condition: formData.condition,
        engineCapacity: formData.engineCapacity,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        pricingType: formData.pricingType,
        price: formData.price,
        negotiable: formData.negotiable,
        financeType: formData.financeType,
        outstandingBalance: formData.outstandingBalance,
        monthlyPayment: formData.monthlyPayment,
        remainingTerm: formData.remainingTerm,
        askingPrice: formData.askingPrice,
        city: formData.city,
        district: formData.district,
        features: formData.features,
        phone: formData.phone,
        whatsapp: formData.whatsappSameAsPhone ? formData.phone : formData.whatsapp,
        email: formData.email,
        preferredContact: formData.preferredContact,
        bestTimeToCall: formData.bestTimeToCall
      })

      setFormData(prev => ({
        ...prev,
        description: normalizedDescription
      }))

      const totalDuration = performance.now() - overallStart
      logger.debug('AI description inline generation', {
        scope: 'post-page',
        status: 'success',
        durations: {
          totalMs: Number(totalDuration.toFixed(2))
        },
        lineCount: linesCount
      })

      showSuccess('Description generated successfully!', 2000)
    } catch (error) {
      logger.error('AI description inline generation failed', error as Error)
      showError('Could not build the description. Try again later.', 4000)
    } finally {
      setAiLoading(false)
    }
  }
  
  const handleSubmit = async () => {
    if (!validateForm()) return

    // Proceed with submission
    await submitListing()
  }

  const submitListing = async () => {
    setLoading(true)
    try {
      // Check if user is authenticated
      if (!user) {
        router.push('/?auth=true&redirect=/post')
        showWarning('Sign in required to post a listing.', 5000)
        setLoading(false)
        return
      }

      const hasActiveUploads = Object.values(uploadStatus).some(status =>
        ['pending', 'compressing', 'uploading'].includes(status.status)
      )

      if (hasActiveUploads || formData.images.length > 0) {
        showWarning('Wait for all image uploads to finish or retry failed uploads before submitting.', 5000)
        setLoading(false)
        return
      }

      if (formData.imageUrls.length === 0) {
        showError('At least one image required', 5000)
        setLoading(false)
        return
      }

      const imageUrls = [...formData.imageUrls]

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
        engine_capacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
        grade: formData.trim || formData.grade || null, // Database uses 'grade' column
        location: `${formData.city}, ${formData.district}`,
        city: formData.city,
        district: formData.district,
        image_urls: imageUrls, // This is the array of all images
        image_url: imageUrls[0] || null, // This is the primary image
        status: 'pending', // New listings start as pending
        // Contact information
        phone: formatPhoneDisplay(formData.phone, '94'),
        whatsapp: formatPhoneDisplay(formData.whatsapp || formData.phone, '94'),
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
        // Promotion flags
        is_featured: false,
        is_top_spot: false,
        is_boosted: false,
        is_urgent: false
      }

      // Validate required fields before submitting
      const requiredFields = {
        user_id: listingData.user_id,
        title: listingData.title,
        price: listingData.price
      }

      // Check for any undefined or null values that could cause constraint violations

      // Check if we're in edit mode
      const editId = searchParams.get('edit')
      let data, error

      if (editId) {
        // Update existing listing

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
          throw error
        }

        localStorage.removeItem('vehiclePostDraft')
        showSuccess('Listing updated successfully!', 2000)
        // Redirect back to profile with success message
        setTimeout(() => router.push('/profile?updated=true'), 1000)

      } else {
        // Create new listing via API route

        const response = await fetch('/api/listings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: listingData.title,
            description: listingData.description,
            details: listingData.details,
            vehicleType: listingData.vehicle_type,
            make: formData.make,
            customMake: formData.customMake,
            model: formData.model,
            customModel: formData.customModel,
            year: listingData.year,
            mileage: listingData.mileage,
            condition: listingData.condition || formData.condition,
            fuelType: listingData.fuel_type,
            transmission: listingData.transmission,
            bodyType: listingData.body_type,
            engineCapacity: listingData.engine_capacity,
            trim: listingData.grade,
            grade: listingData.grade,
            price: listingData.price,
            pricingType: listingData.pricing_type,
            negotiable: listingData.negotiable,
            financeType: listingData.finance_type,
            outstandingBalance: listingData.outstanding_balance,
            monthlyPayment: listingData.monthly_payment,
            remainingTerm: listingData.remaining_term,
            askingPrice: listingData.asking_price,
            district: listingData.district,
            city: listingData.city,
            location: listingData.location,
            phone: formData.phone, // Send raw phone, API will format
            whatsapp: formData.whatsapp, // Send raw whatsapp, API will format
            email: listingData.email,
            imageUrls: listingData.image_urls || [],
            phoneOtpCode: pendingOtpCode || undefined // Include OTP if phone changed
          })
        })

        const result = await response.json()

        if (!response.ok) {

          // Handle validation errors
          if (response.status === 400 && result.errors) {
            setErrors(result.errors)

            // Show detailed validation errors to user
            const errorFields = Object.keys(result.errors)
            const errorCount = errorFields.length
            const firstError = result.errors[errorFields[0]]

            if (errorCount === 1) {
              showError(`Validation failed: ${firstError}`, 5000)
            } else {
              showError(`Validation failed: ${errorCount} errors found. ${firstError}`, 6000)
            }

            // Scroll to first error field
            if (errorFields.length > 0) {
              const firstField = errorFields[0]
              setTimeout(() => {
                const element = document.querySelector(`[name="${firstField}"]`) as HTMLElement
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  element.focus()
                }
              }, 100)
            }
            return
          }

          // Handle duplicate errors
          if (response.status === 409) {
            showError(result.error || 'You have already posted a similar listing recently.', 6000)
            return
          }

          // Handle server errors with details
          if (response.status === 500 && result.details) {
            showError(`Server error: ${result.details}`, 7000)
            return
          }

          // Generic error with details if available
          showError(result.error || result.details || 'Failed to create listing', 5000)
          return
        }

        localStorage.removeItem('vehiclePostDraft')
        showSuccess('Listing created successfully! Redirecting...', 2000)
        // Reset verification state
        setShowVerificationModal(false)
        setPendingOtpCode('')
        setPendingPhone('')
        setPhoneVerified(false)
        if (formData.phone) {
          setOriginalPhone(formData.phone)
        }
        // TEMPORARILY DISABLED - Redirect to paid features page
        // Redirect to profile instead
        setTimeout(() => {
          router.push('/profile?new=true')
          /* ORIGINAL PAID FEATURES REDIRECT (to re-enable later):
          if (result.listing && result.listing.id) {
            router.push(`/post/paid-features?new=true&listing_id=${result.listing.id}`)
          } else {
            router.push('/post/paid-features?new=true')
          }
          */
        }, 1000)
      }
    } catch (error: any) {
      // Show the actual error message to the user
      const errorMessage = error?.message || 'Error posting vehicle. Try again later.'
      showError(errorMessage, 7000)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerified = (newPhone: string) => {
    setFormData(prev => ({ ...prev, phone: newPhone }))
    setShowEditPhoneModal(false)
    // Toast is now shown in EditPhoneModal component
  }

  const handleWhatsAppVerified = (newWhatsApp: string) => {
    setFormData(prev => ({ ...prev, whatsapp: newWhatsApp }))
    setShowEditWhatsAppModal(false)
    // Toast is now shown in EditPhoneModal component
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
    <div className="min-h-screen bg-gray-50 lg:py-8 pb-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-4 lg:mb-8 py-4 lg:py-0 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 border-b lg:border-0">
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">Sell Your Vehicle</h1>
          <p className="text-sm lg:text-base text-gray-600">Reach thousands of potential buyers across Sri Lanka</p>
        </div>

        {/* Upload status indicator */}
        {imagesUploading && (
          <div className="mb-4 p-3 bg-white border border-gray-300 rounded-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-sm text-gray-700">Uploading images in the background...</span>
          </div>
        )}

        {/* Form Content - Single Scrolling Page */}
        <div className="lg:bg-white lg:rounded-xl lg:shadow-sm lg:p-8">
          <div className="space-y-4 lg:space-y-8">
            {/* Vehicle Type Section */}
            <div className="vehicle-type-section bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 py-6 lg:py-0 border-b lg:border-0">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Type</h2>
              </div>
                
                {/* Dropdown Menu */}
                <div ref={vehicleDropdownRef} className="relative mb-6">
                  <Button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      showVehicleDropdown: !prev.showVehicleDropdown
                    } as any))}
                    variant="outline"
                    size="default"
                    className={`w-full px-6 justify-between text-left ${
                      formData.vehicleType
                        ? 'border-blue-300 bg-blue-50'
                        : ''
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
                  </Button>
                  
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
                            className={`w-full p-4 min-h-touch rounded-lg transition-all text-left hover:bg-gray-50 active:scale-95 ${
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
                        placeholder="Select a district first"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                      />
                    )}
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>
                </div>
              </div>

              {/* Pricing and features now handled by VehicleFormFactory */}
            </div>

            {/* Photos Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos <span className="text-red-500">*</span></h2>
              </div>
              
              <div>
                {/* Image Upload Area */}
                <div className="mb-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="default"
                    className={`w-full ${errors.images ? 'border-red-300' : ''}`}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photos
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    At least 1 photo required. Maximum 10 photos, up to 10MB each. Formats: JPEG, JPG, PNG, TIFF, WebP.
                  </p>
                  {errors.images && <p className="text-red-600 text-sm mt-1">{errors.images}</p>}
                </div>
                
                {/* Image Preview Grid */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => {
                      const isLocal = preview.type === 'local' && preview.file instanceof File
                      const uploadId = isLocal && preview.file ? uploadIdMapRef.current.get(preview.file) : undefined
                      const uploadInfo = uploadId ? uploadStatus[uploadId] : undefined
                      const previewKey =
                        preview.type === 'local' && preview.file
                          ? `${preview.file.name}-${preview.file.lastModified}-${index}`
                          : `${preview.url}-${index}`

                      return (
                        <div key={previewKey} className="relative group overflow-hidden rounded-lg border border-gray-200">
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                              Main
                            </span>
                          )}

                          {isLocal && uploadInfo && (
                            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white text-xs p-2">
                              {uploadInfo.status === 'compressing' && <span>Compressing…</span>}
                              {uploadInfo.status === 'uploading' && <span>Uploading…</span>}
                              {uploadInfo.status === 'error' && (
                                <>
                                  <span className="text-center">
                                    {uploadInfo.message || 'Upload failed'}
                                  </span>
                                  {preview.file && (
                                    <button
                                      type="button"
                                      onClick={() => retryImageUpload(preview.file as File)}
                                      className="px-2 py-1 bg-white text-gray-900 rounded shadow"
                                    >
                                      Retry
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                
              </div>

              {/* Description Generator */}
              <DescriptionGenerator
                ref={descriptionGeneratorRef}
                formData={formData}
                setFormData={setFormData}
                onGenerate={generateAIDescription}
                aiLoading={aiLoading}
                errors={errors}
              />
            </div>

            {/* Contact Information Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <p className="text-sm text-gray-600">Buyers will use this information to contact you about this listing.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></Label>
                    <p className="text-gray-900 mt-1">{formData.phone ? `+94 ${formData.phone}` : 'Not set'}</p>
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditPhoneModal(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {formData.phone ? 'Edit' : 'Add'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-700">WhatsApp Number</Label>
                    <label className="flex items-center mt-1 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.whatsappSameAsPhone}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setFormData(prev => ({
                            ...prev,
                            whatsappSameAsPhone: checked,
                            whatsapp: checked ? prev.phone : prev.whatsapp
                          }))
                        }}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Same as phone number</span>
                    </label>
                    {!formData.whatsappSameAsPhone && (
                      <p className="text-gray-900">{formData.whatsapp ? `+94 ${formData.whatsapp}` : 'Not set'}</p>
                    )}
                    {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
                  </div>
                  {!formData.whatsappSameAsPhone && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEditWhatsAppModal(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {formData.whatsapp ? 'Edit' : 'Add'}
                    </Button>
                  )}
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="pt-8 border-t border-gray-200 mt-8">
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button
                  type="button"
                  onClick={() => router.push('/listings')}
                  variant="outline"
                  size="default"
                  className="order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  variant="primary"
                  size="default"
                  className="order-1 sm:order-2"
                >
                  {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Listing' : 'Publish Listing')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Edit Phone Modal */}
      <EditPhoneModal
        currentPhone={formData.phone}
        isOpen={showEditPhoneModal}
        onVerified={handlePhoneVerified}
        onCancel={() => setShowEditPhoneModal(false)}
        purpose="listing"
        showSuccessToast={showSuccess}
        showErrorToast={showError}
      />

      {/* Edit WhatsApp Modal */}
      <EditPhoneModal
        currentPhone={formData.whatsapp}
        isOpen={showEditWhatsAppModal}
        onVerified={handleWhatsAppVerified}
        onCancel={() => setShowEditWhatsAppModal(false)}
        purpose="listing"
        showSuccessToast={showSuccess}
        showErrorToast={showError}
      />
    </div>
  )
}
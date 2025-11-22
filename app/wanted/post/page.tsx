'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/app/contexts/AuthContext'
import Link from 'next/link'
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
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { useToast } from '@/app/components/notifications/useToast'
import { toast } from 'sonner'
import { Toast } from '@/app/components/notifications/Toast'
import { logger } from '@/lib/utils/logger'
import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
import { loadContactFromCache, saveContactToCache } from '@/lib/utils/contactCache'
import { Edit } from 'lucide-react'
import EditPhoneModal from '@/app/components/EditPhoneModal'

interface FormData {
  description: string
  vehicleType: VehicleType | ''
  min_budget: string
  max_budget: string
  make: string
  customMake: string
  model: string
  customModel: string
  min_year: string
  max_year: string
  location: string
  phone: string
  whatsapp: string
  whatsappSameAsPhone: boolean
  fuel_type: string
  transmission: string
  max_mileage: string
}

interface FormErrors {
  [key: string]: string
}

export default function PostWantedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading, getPhoneNumber, getWhatsAppNumber } = useUserProfile()
  const { toasts, showError, showSuccess, removeToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [highPriority, setHighPriority] = useState(false)

  // Phone verification modals
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false)
  const [showEditWhatsAppModal, setShowEditWhatsAppModal] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingPhone, setPendingPhone] = useState<string>('')

  // Detect edit mode
  const isEditMode = searchParams.get('edit') !== null
  const editId = searchParams.get('edit')
  const [step, setStep] = useState(1) // Multi-step form
  const [showPreview, setShowPreview] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})

  // Guard to prevent clearing fields on edit data load
  const editDataLoadedRef = useRef(false)
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [originalPhone, setOriginalPhone] = useState<string>('')
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false)
  const [pendingOtpCode, setPendingOtpCode] = useState<string>('')

  const [formData, setFormData] = useState<FormData>({
    description: '',
    vehicleType: '',
    min_budget: '',
    max_budget: '',
    make: '',
    customMake: '',
    model: '',
    customModel: '',
    min_year: '',
    max_year: '',
    location: '',
    phone: '',
    whatsapp: '',
    whatsappSameAsPhone: true,
    fuel_type: '',
    transmission: '',
    max_mileage: ''
  })
  
  // Check authentication status and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // Pass the redirect URL directly in the URL parameters
      router.push('/?auth=true&redirect=/wanted/post')
    }
  }, [user, authLoading, router])

  // Load existing wanted request data for edit mode
  useEffect(() => {
    if (isEditMode && editId && user) {
      logger.debug('Loading existing wanted request for edit', {
        component: 'PostWantedPage',
        action: 'loadWantedRequest',
        requestId: editId
      })

      const loadWantedRequest = async () => {
        try {
          const { data, error } = await supabase
            .from('wanted_requests')
            .select('*')
            .eq('id', editId)
            .eq('user_id', user.id)
            .single()

          if (error) {
            logger.error('Failed to load wanted request', error as Error, {
              component: 'PostWantedPage',
              action: 'loadWantedRequest',
              requestId: editId
            })
            showError('Error loading wanted request. Please try again.', 4000)
            router.push('/wanted')
            return
          }

          if (data) {
            logger.debug('Loaded wanted request data', {
              component: 'PostWantedPage',
              action: 'loadWantedRequest',
              requestId: editId
            })

            // Parse location if it contains district
            let district = ''
            let city = ''
            if (data.location) {
              const locationParts = data.location.split(', ')
              if (locationParts.length === 2) {
                city = locationParts[0]
                district = locationParts[1]
              } else {
                city = data.location
              }
            }

            // Parse phone number - convert to local format (0XXXXXXXXX)
            let phoneNumber = data.phone || ''
            if (phoneNumber.startsWith('+94 ')) {
              phoneNumber = '0' + phoneNumber.replace('+94 ', '').replace(/\s/g, '')
            } else if (phoneNumber.startsWith('+94')) {
              phoneNumber = '0' + phoneNumber.substring(3).replace(/\s/g, '')
            }

            // Parse WhatsApp number - convert to local format (0XXXXXXXXX)
            let whatsappNumber = data.whatsapp || ''
            if (whatsappNumber.startsWith('+94 ')) {
              whatsappNumber = '0' + whatsappNumber.replace('+94 ', '').replace(/\s/g, '')
            } else if (whatsappNumber.startsWith('+94')) {
              whatsappNumber = '0' + whatsappNumber.substring(3).replace(/\s/g, '')
            }

            // Determine if WhatsApp should be same as phone
            const whatsappSameAsPhone = !whatsappNumber || whatsappNumber === phoneNumber

            // Set flag before updating form data to prevent cascading clears
            editDataLoadedRef.current = true

            // Map database fields to form fields
            setFormData({
              description: data.description || '',
              vehicleType: data.vehicle_type || '',
              min_budget: data.min_budget ? data.min_budget.toString() : '',
              max_budget: data.max_budget ? data.max_budget.toString() : '',
              make: data.make || '',
              customMake: data.make === 'Other' ? data.make : '',
              model: data.model || '',
              customModel: data.model === 'Other' ? data.model : '',
              min_year: data.min_year ? data.min_year.toString() : '',
              max_year: data.max_year ? data.max_year.toString() : '',
              location: city,
              phone: phoneNumber,
              whatsapp: whatsappSameAsPhone ? phoneNumber : whatsappNumber,
              whatsappSameAsPhone: whatsappSameAsPhone,
              fuel_type: data.fuel_type || '',
              transmission: data.transmission || '',
              max_mileage: data.max_mileage ? data.max_mileage.toString() : ''
            })

            // Store original phone for comparison
            if (phoneNumber) {
              setOriginalPhone(phoneNumber)
              setPhoneVerified(true) // Pre-verified for edit mode
            }

            // Set district if found
            if (district) {
              setSelectedDistrict(district)
            }

            setHighPriority(Boolean(data.is_high_priority))
          }
        } catch (error) {
          logger.error('Error in loadWantedRequest', error as Error, {
            component: 'PostWantedPage',
            action: 'loadWantedRequest',
            requestId: editId
          })
          toast.error('Error loading wanted request. Try again later.')
          router.push('/wanted')
        }
      }

      loadWantedRequest()
    }
  }, [isEditMode, editId, user, router])

  // Auto-populate phone number and WhatsApp from user profile OR cache
  useEffect(() => {
    if (!profileLoading && profile && !isEditMode) {
      const phoneNumber = getPhoneNumber()
      const whatsappNumber = getWhatsAppNumber()

      // Priority 1: Use profile contact info if available
      if (phoneNumber || whatsappNumber) {
        const populatedPhone = phoneNumber || ''
        setFormData(prev => {
          // CRITICAL: Only update if values actually need to change (prevent infinite loop)
          const needsUpdate =
            (!prev.phone && phoneNumber) ||
            (!prev.whatsapp && (whatsappNumber || phoneNumber))

          if (!needsUpdate) return prev

          return {
            ...prev,
            phone: prev.phone || phoneNumber, // Only populate if empty
            whatsapp: prev.whatsapp || whatsappNumber || phoneNumber, // Populate WhatsApp, fallback to phone
            whatsappSameAsPhone: prev.whatsappSameAsPhone !== false ? (whatsappNumber === phoneNumber || !whatsappNumber) : prev.whatsappSameAsPhone
          }
        })
        // Store original phone for comparison
        if (!originalPhone && populatedPhone) {
          setOriginalPhone(populatedPhone)
        }
      } else {
        // Priority 2: If profile has no contact info, load from cache
        const cached = loadContactFromCache()
        if (cached && (cached.phone || cached.whatsapp)) {
          setFormData(prev => {
            const needsUpdate = (!prev.phone && cached.phone) || (!prev.whatsapp && cached.whatsapp)
            if (!needsUpdate) return prev

            return {
              ...prev,
              phone: prev.phone || cached.phone || '',
              whatsapp: prev.whatsapp || cached.whatsapp || cached.phone || '',
              whatsappSameAsPhone: prev.whatsappSameAsPhone !== false ? (cached.whatsapp === cached.phone || !cached.whatsapp) : prev.whatsappSameAsPhone
            }
          })
          // Store cached phone as original for comparison
          if (!originalPhone && cached.phone) {
            setOriginalPhone(cached.phone)
          }
        }
      }
    }
  }, [profile, profileLoading, getPhoneNumber, getWhatsAppNumber, isEditMode, originalPhone])

  // Store original phone when form data changes (for edit mode)
  useEffect(() => {
    if (isEditMode && formData && formData.phone && !originalPhone) {
      setOriginalPhone(formData.phone)
      setPhoneVerified(true) // Pre-verified for edit mode
    }
  }, [isEditMode, formData, originalPhone])

  // Auto-update WhatsApp when phone changes and checkbox is checked
  useEffect(() => {
    if (formData.whatsappSameAsPhone && formData.whatsapp !== formData.phone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }))
    }
  }, [formData.phone, formData.whatsappSameAsPhone, formData.whatsapp])
  
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

  // Helper functions to get makes and models based on vehicle type
  const getMakeOptions = () => {
    if (!formData.vehicleType) return []
    return getMakesByCategory(formData.vehicleType)
  }

  const getModelOptions = () => {
    if (!formData.make || !formData.vehicleType) return []
    const makeId = formData.make.toLowerCase().replace(/[\s-]/g, '-')
    return getModelsByMake(formData.vehicleType, makeId)
  }

  // Clear model when make or vehicle type changes if it's no longer valid
  useEffect(() => {
    // Skip clearing if we're in edit mode and data just loaded
    if (editDataLoadedRef.current) {
      editDataLoadedRef.current = false
      return
    }

    // Also skip if we're in edit mode during initial load
    if (isEditMode && !formData.vehicleType) {
      return
    }

    const models = getModelOptions()
    // Clear model if it's not in the new make's models
    // But skip this check if we just loaded edit data (models might not be populated yet)
    if (formData.model && formData.model !== 'Other' && models.length > 0 && !models.includes(formData.model)) {
      setFormData(prev => ({ ...prev, model: '', customModel: '' }))
    }
  }, [formData.make, formData.vehicleType, isEditMode])

  // Generate title from make and model
  const generateTitle = () => {
    if (!formData.make) return ''
    
    const actualMake = formData.make === 'Other' ? formData.customMake : formData.make
    const actualModel = formData.model === 'Other' ? formData.customModel : formData.model
    const makeModel = [actualMake, actualModel].filter(Boolean).join(' ')
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
        if (!formData.vehicleType) {
          newErrors.vehicleType = 'Please select a vehicle type'
        }
        if (!formData.make) {
          newErrors.make = 'Please select a vehicle make'
        } else if (formData.make === 'Other' && !formData.customMake) {
          newErrors.make = 'Please enter custom make name'
        }
        if (!formData.model) {
          newErrors.model = 'Please select a vehicle model'
        } else if (formData.model === 'Other' && !formData.customModel) {
          newErrors.model = 'Please enter custom model name'
        }
        if (!formData.min_budget) {
          newErrors.min_budget = 'Please enter minimum budget'
        } else if (parseFloat(formData.min_budget) < 0) {
          newErrors.min_budget = 'Budget cannot be negative'
        }
        if (!formData.max_budget) {
          newErrors.max_budget = 'Please enter maximum budget'
        } else if (parseFloat(formData.max_budget) < 0) {
          newErrors.max_budget = 'Budget cannot be negative'
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
        }
        break
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
          // Try to find by name attribute first
          element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
        }

        // Fallback to finding by error class if name attribute not found
        if (!element) {
          element = document.querySelector('.border-red-500') as HTMLElement
        }

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          })

          // Focus the field if it's focusable
          if (element instanceof HTMLInputElement ||
              element instanceof HTMLSelectElement ||
              element instanceof HTMLTextAreaElement) {
            element.focus()
          }
        }
      }, 100)
    }

    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const highPriorityPaymentUrl = process.env.NEXT_PUBLIC_WANTED_PAYMENT_URL

  const handlePostCreationRedirect = (requestId?: string) => {
    // TEMPORARILY DISABLED - High priority payment redirect
    // Always redirect to success page instead
    router.push('/wanted?posted=success')

    /* ORIGINAL HIGH PRIORITY REDIRECT (to re-enable later):
    if (highPriority && requestId) {
      if (highPriorityPaymentUrl) {
        const separator = highPriorityPaymentUrl.includes('?') ? '&' : '?'
        router.push(`${highPriorityPaymentUrl}${separator}requestId=${requestId}`)
      } else {
        logger.warn('High priority payment URL is not configured', {
          component: 'PostWantedPage',
          action: 'handlePostCreationRedirect',
          requestId
        })
        showError('High priority payments are coming soon. Your request is live as a regular post.', 5000)
        router.push('/wanted?posted=success')
      }
    } else {
      router.push('/wanted?posted=success')
    }
    */
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep(2)) {
      return
    }

    // Proceed with submission
    await submitWantedRequest()
  }

  const submitWantedRequest = async () => {
    setLoading(true)

    const locationString = formData.location && selectedDistrict
      ? `${formData.location}, ${selectedDistrict}`
      : formData.location || selectedDistrict

    const title = generateTitle()

    const requestPayload = {
      title,
      description: formData.description.trim() || null,
      min_budget: formData.min_budget,
      max_budget: formData.max_budget,
      make: formData.make,
      customMake: formData.customMake,
      model: formData.model,
      customModel: formData.customModel,
      min_year: formData.min_year,
      max_year: formData.max_year,
      location: locationString,
      phone: formData.phone,
      whatsapp: formData.whatsappSameAsPhone ? formData.phone : formData.whatsapp || null,
      phoneOtpCode: pendingOtpCode || undefined, // Include OTP if phone changed
      fuel_type: formData.fuel_type || null,
      transmission: formData.transmission || null,
      max_mileage: formData.max_mileage || null
    }

    try {
      if (isEditMode && editId) {
        const response = await fetch('/api/wanted-requests/update', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requestId: editId,
            ...requestPayload
          })
        })

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 400 && result.errors) {
            setErrors(result.errors)
            showError(result.error || 'Validation failed. Please check your input.', 4000)
            return
          }

          showError(result.error || 'Failed to update wanted request', 4000)
          return
        }

        showSuccess('Wanted request updated successfully!', 2000)
        // Reset verification state
        setShowVerificationModal(false)
        setPendingOtpCode('')
        setPendingPhone('')
        setPhoneVerified(false)
        if (formData.phone) {
          setOriginalPhone(formData.phone)
        }
        setTimeout(() => router.push('/profile?updated=wanted-request'), 1000)
      } else {
        const response = await fetch('/api/wanted-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        })

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 400 && result.errors) {
            setErrors(result.errors)
            showError(result.error || 'Validation failed. Please check your input.', 4000)
            return
          }

          if (response.status === 409) {
            showError(result.error || 'You have already posted a similar request recently.', 4000)
            return
          }

          if (response.status === 429) {
            showError(result.message || 'Too many requests. Please try again later.', 4000)
            return
          }

          throw new Error(result.error || 'Failed to create wanted request')
        }

        showSuccess('Wanted request created successfully! Redirecting...', 2000)

        // Reset verification state
        setShowVerificationModal(false)
        setPendingOtpCode('')
        setPendingPhone('')
        setPhoneVerified(false)
        if (formData.phone) {
          setOriginalPhone(formData.phone)
        }

        setTimeout(() => {
          const requestId = result.request?.id
          handlePostCreationRedirect(requestId)
        }, 1000)
      }
    } catch (error) {
      logger.error('Error posting wanted request', error as Error, {
        component: 'PostWantedPage',
        action: 'handleSubmit',
        isEditMode
      })
      showError('Error posting request. Please try again.', 4000)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneVerified = (newPhone: string, otpCode?: string, shouldCache?: boolean) => {
    setFormData(prev => ({ ...prev, phone: newPhone }))
    if (otpCode) {
      setPendingOtpCode(otpCode)
    }

    // Save to cache if requested (only when profile has no contact info)
    if (shouldCache) {
      saveContactToCache(newPhone, formData.whatsapp || newPhone)
    }

    setShowEditPhoneModal(false)
    // Toast is now shown in EditPhoneModal component
  }

  const handleWhatsAppVerified = (newWhatsApp: string, otpCode?: string) => {
    setFormData(prev => ({ ...prev, whatsapp: newWhatsApp }))
    // WhatsApp doesn't require OTP for API submission, only phone does
    setShowEditWhatsAppModal(false)
    // Toast is now shown in EditPhoneModal component
  }

  // CRITICAL FIX: Memoize callbacks to prevent infinite re-renders
  // Inline arrow functions recreate on every render, causing EditPhoneModal's useEffect to re-run infinitely
  const handleClosePhoneModal = useCallback(() => {
    console.log('[PostWantedPage] handleClosePhoneModal called')
    setShowEditPhoneModal(false)
  }, [])

  const handleCloseWhatsAppModal = useCallback(() => {
    console.log('[PostWantedPage] handleCloseWhatsAppModal called')
    setShowEditWhatsAppModal(false)
  }, [])

  const formatPreviewBudget = () => {
    if (!formData.min_budget && !formData.max_budget) return 'Not specified'
    if (!formData.min_budget) return `Up to Rs. ${formatBudget(formData.max_budget)}`
    if (!formData.max_budget) return `Rs. ${formatBudget(formData.min_budget)}+`
    return `Rs. ${formatBudget(formData.min_budget)} - ${formatBudget(formData.max_budget)}`
  }

  // DEBUG: Track render cycles and modal state
  const renderCountRef = useRef(0)
  renderCountRef.current += 1
  
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow
    const bodyPointerEvents = window.getComputedStyle(document.body).pointerEvents
    
    console.log('[PostWantedPage] MOUNT/RENDER #' + renderCountRef.current, {
      showEditPhoneModal,
      showEditWhatsAppModal,
      authLoading,
      profileLoading,
      user: !!user,
      bodyOverflow: bodyOverflow || '(empty/default)',
      bodyPointerEvents,
      timestamp: Date.now()
    })
    
    // Check for blocking overlays
    const overlays = document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]')
    if (overlays.length > 0) {
      console.log('[PostWantedPage] Found potential overlays:', Array.from(overlays).map(el => ({
        tag: el.tagName,
        classes: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents,
        display: window.getComputedStyle(el).display
      })))
    }
    
    return () => {
      console.log('[PostWantedPage] UNMOUNT')
    }
  }, [showEditPhoneModal, showEditWhatsAppModal, authLoading, profileLoading, user])

  // DEBUG: Track link/button clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a') || target.closest('button')
      
      if (link) {
        const isLink = link.tagName === 'A'
        const href = isLink ? (link as HTMLAnchorElement).href : null
        const text = link.textContent?.trim().slice(0, 50) || 'unknown'
        
        console.log('[PostWantedPage] CLICK DETECTED:', {
          type: isLink ? 'LINK' : 'BUTTON',
          href: href?.slice(-50),
          text,
          target: target.tagName,
          defaultPrevented: e.defaultPrevented,
          timeStamp: e.timeStamp,
          listenersOnDocument: (() => {
            try {
              return (window as any).getEventListeners?.(document)?.mousedown?.length || 'N/A'
            } catch {
              return 'N/A'
            }
          })()
        })
        
        // Check if click is being blocked
        setTimeout(() => {
          if (isLink && !e.defaultPrevented) {
            const finalHref = (link as HTMLAnchorElement).href
            console.log('[PostWantedPage] POST-CLICK CHECK:', {
              href: finalHref,
              locationChanged: window.location.href !== finalHref,
              currentLocation: window.location.href.slice(-50)
            })
          }
        }, 100)
      }
    }

    // Use capture phase to catch all clicks early
    document.addEventListener('click', handleClick, true)
    
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [])
  
  // DEBUG: Track visibility changes (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('[PostWantedPage] VISIBILITY CHANGE:', {
        visibilityState: document.visibilityState,
        hidden: document.hidden,
        showEditPhoneModal,
        showEditWhatsAppModal,
        listenersOnDocument: (() => {
          try {
            return (window as any).getEventListeners?.(document)?.mousedown?.length || 'N/A'
          } catch {
            return 'N/A'
          }
        })()
      })
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [showEditPhoneModal, showEditWhatsAppModal])

  return (
    <div className="min-h-screen bg-gray-50 lg:py-8 pb-12">
      <div className="max-w-3xl mx-auto px-4 lg:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 lg:mb-8 py-4 lg:py-0 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 border-b lg:border-0">
          <Link 
            href="/wanted" 
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
            onClick={(e) => {
              console.log('[PostWantedPage] Link onClick handler FIRED:', {
                href: '/wanted',
                defaultPrevented: e.defaultPrevented,
                timeStamp: Date.now(),
                eventPhase: e.eventPhase,
                bubbles: e.bubbles
              })
            }}
          >
            <span>←</span> Back to Wanted Requests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Wanted Request' : 'Post a Wanted Request'}
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-4 lg:mb-8 py-4 lg:py-0 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 border-b lg:border-0">
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

        <form onSubmit={handleSubmit} className="lg:bg-white lg:rounded-lg lg:shadow-md lg:p-6">
          {/* Step 1: Vehicle Details */}
          {step === 1 && (
            <div className="space-y-4 lg:space-y-6">
              <div className="bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 py-6 lg:py-0 border-b lg:border-0">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">What vehicle are you looking for?</h2>
              </div>
              
              {/* Vehicle Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.vehicleType ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.vehicleType}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      vehicleType: e.target.value as VehicleType | '',
                      make: '',
                      customMake: '',
                      model: '',
                      customModel: ''
                    })
                    if (errors.vehicleType) setErrors({ ...errors, vehicleType: '' })
                  }}
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  {getVehicleCategories().map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.vehicleType && <p className="text-red-500 text-sm mt-1">{errors.vehicleType}</p>}
              </div>
              
              {/* Make and Model */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vehicle Make <span className="text-red-500">*</span>
                  </label>
                  {formData.make === 'Other' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter custom make name"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.make ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.customMake}
                        onChange={(e) => {
                          setFormData({ ...formData, customMake: e.target.value })
                          if (errors.make) setErrors({ ...errors, make: '' })
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, make: '', customMake: '', model: '', customModel: '' })
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ← Back to make selection
                      </button>
                    </div>
                  ) : (
                    <select
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.make ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.make}
                      onChange={(e) => {
                        setFormData({ ...formData, make: e.target.value, model: '', customModel: '' })
                        if (errors.make) setErrors({ ...errors, make: '' })
                      }}
                      disabled={!formData.vehicleType}
                      required
                    >
                      <option value="">Select Make</option>
                      {getMakeOptions().map(make => (
                        <option key={make.id} value={make.name}>{make.name}</option>
                      ))}
                      <option value="Other">Other (Custom)</option>
                    </select>
                  )}
                  {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vehicle Model <span className="text-red-500">*</span>
                  </label>
                  {formData.model === 'Other' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Enter custom model name"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors.model ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={formData.customModel}
                        onChange={(e) => {
                          setFormData({ ...formData, customModel: e.target.value })
                          if (errors.model) setErrors({ ...errors, model: '' })
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, model: '', customModel: '' })
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ← Back to model selection
                      </button>
                    </div>
                  ) : (
                    <select
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.model ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.model}
                      onChange={(e) => {
                        setFormData({ ...formData, model: e.target.value, customModel: '' })
                        if (errors.model) setErrors({ ...errors, model: '' })
                      }}
                      disabled={!formData.make || !formData.vehicleType}
                      required
                    >
                      <option value="">Select Model</option>
                      {formData.make === 'Other' ? (
                        <option value="Other">Other (Custom)</option>
                      ) : (
                        <>
                          {getModelOptions().map(model => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                          <option value="Other">Other (Custom)</option>
                        </>
                      )}
                    </select>
                  )}
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
                      min="0"
                      placeholder="Minimum"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.min_budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.min_budget}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow positive numbers or empty string
                        if (value === '' || parseFloat(value) >= 0) {
                          setFormData({ ...formData, min_budget: value })
                          if (errors.min_budget) setErrors({ ...errors, min_budget: '' })
                        }
                      }}
                      required
                    />
                    {errors.min_budget && <p className="text-red-500 text-sm mt-1">{errors.min_budget}</p>}
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder="Maximum"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.max_budget ? 'border-red-500' : 'border-gray-300'
                      }`}
                      value={formData.max_budget}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow positive numbers or empty string
                        if (value === '' || parseFloat(value) >= 0) {
                          setFormData({ ...formData, max_budget: value })
                          if (errors.max_budget) setErrors({ ...errors, max_budget: '' })
                        }
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
                  min="0"
                  placeholder="e.g., 80000"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.max_mileage}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow positive numbers or empty string
                    if (value === '' || parseFloat(value) >= 0) {
                      setFormData({ ...formData, max_mileage: value })
                    }
                  }}
                />
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
                    Preferred District
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
                    Preferred City/Area
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
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <p className="text-gray-900 mt-1">{formData.phone ? formatPhoneDisplay(formData.phone, '94') : 'Not set'}</p>
                  {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditPhoneModal(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {formData.phone ? 'Edit' : 'Add'}
                </button>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
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
                    <p className="text-gray-900">{formData.whatsapp ? formatPhoneDisplay(formData.whatsapp, '94') : 'Not set'}</p>
                  )}
                  {errors.whatsapp && <p className="text-red-600 text-sm mt-1">{errors.whatsapp}</p>}
                </div>
                {!formData.whatsappSameAsPhone && (
                  <button
                    type="button"
                    onClick={() => setShowEditWhatsAppModal(true)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {formData.whatsapp ? 'Edit' : 'Add'}
                  </button>
                )}
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
                          <span className="font-medium">{formData.make === 'Other' ? formData.customMake : formData.make}</span>
                        </div>
                      )}
                      {formData.model && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model:</span>
                          <span className="font-medium">{formData.model === 'Other' ? formData.customModel : formData.model}</span>
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

                {/* TEMPORARILY DISABLED - High Priority Checkbox
                {!isEditMode && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={highPriority}
                        onChange={(e) => setHighPriority(e.target.checked)}
                        className="mt-1 w-5 h-5 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-900">
                            Mark as High Priority
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-600 text-white">
                            Rs. 1,500 / 7 days
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          This is a paid feature. You will be directed to a payment page after publishing the request.
                        </p>
                      </div>
                    </label>
                  </div>
                )}
                */}

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
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
                    ) : isEditMode ? (
                      'Update Wanted Request'
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

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      {/* Edit Phone Modal */}
      <EditPhoneModal
        currentPhone={formData.phone}
        isOpen={showEditPhoneModal}
        onVerified={handlePhoneVerified}
        onCancel={handleClosePhoneModal}
        purpose="wanted"
        hasProfileContact={!!(profile?.phone || profile?.whatsapp)}
      />

      {/* Edit WhatsApp Modal */}
      <EditPhoneModal
        currentPhone={formData.whatsapp}
        isOpen={showEditWhatsAppModal}
        onVerified={handleWhatsAppVerified}
        onCancel={handleCloseWhatsAppModal}
        purpose="wanted"
        hasProfileContact={!!(profile?.phone || profile?.whatsapp)}
      />
    </div>
  )
}
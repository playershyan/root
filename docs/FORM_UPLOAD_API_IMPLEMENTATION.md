# Form Upload API Implementation

Complete guide to the listing form upload system, including image handling, form submission, and API structure.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Form State Management](#form-state-management)
3. [Image Upload Flow](#image-upload-flow)
4. [Form Submission](#form-submission)
5. [API Route Implementation](#api-route-implementation)
6. [Validation & Sanitization](#validation--sanitization)
7. [Error Handling](#error-handling)
8. [Complete Code Examples](#complete-code-examples)

---

## Architecture Overview

### Flow Diagram

```
User Selects Images
    ↓
Client-Side Compression
    ↓
Upload to Cloudinary (/api/upload/cloudinary)
    ↓
Store URLs in Form State (imageUrls)
    ↓
User Fills Form & Submits
    ↓
Client-Side Validation
    ↓
POST to /api/listings (with imageUrls array)
    ↓
Server-Side Validation & Sanitization
    ↓
Insert into Database (Supabase)
    ↓
Return Success/Error
```

### Key Components

1. **Form Component** (`app/post/page.tsx`) - Client-side form
2. **Upload API** (`app/api/upload/cloudinary/route.ts`) - Image upload handler
3. **Listings API** (`app/api/listings/route.ts`) - Form submission handler
4. **Validation** (`lib/validation/listing.ts`) - Input validation
5. **Image Compression** (`lib/utils/image-compression.ts`) - Client-side compression

---

## Form State Management

### State Structure

```typescript
interface FormData {
  // Basic info
  title: string
  description: string
  vehicleType: string
  
  // Vehicle details
  make: string
  customMake: string
  model: string
  customModel: string
  year: string
  mileage: string
  condition: string
  fuelType: string
  transmission: string
  engineCapacity: string
  trim: string
  
  // Pricing
  price: string
  pricingType: 'cash' | 'finance'
  negotiable: boolean
  financeType?: string
  outstandingBalance?: string
  monthlyPayment?: string
  remainingTerm?: string
  askingPrice?: string
  
  // Location
  district: string
  city: string
  
  // Contact
  phone: string
  whatsapp: string
  email: string
  
  // Images
  images: File[]              // Files waiting to be uploaded
  imageUrls: Array<{          // Successfully uploaded images
    url: string
    publicId: string
  }>
}

// Upload status tracking
interface UploadStatusState {
  progress: number
  status: 'compressing' | 'uploading' | 'success' | 'error'
  message?: string
}
```

### State Initialization

```typescript
const [formData, setFormData] = useState<FormData>({
  title: '',
  description: '',
  vehicleType: '',
  make: '',
  customMake: '',
  model: '',
  customModel: '',
  year: '',
  mileage: '',
  condition: '',
  fuelType: '',
  transmission: '',
  engineCapacity: '',
  trim: '',
  price: '',
  pricingType: 'cash',
  negotiable: true,
  district: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
  images: [],
  imageUrls: []
})

const [uploadStatus, setUploadStatus] = useState<Record<string, UploadStatusState>>({})
const [loading, setLoading] = useState(false)
const [errors, setErrors] = useState<Record<string, string>>({})
```

---

## Image Upload Flow

### 1. File Selection Handler

```typescript
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const fileArray = Array.from(files)
  
  // Add files to form state
  setFormData(prev => ({
    ...prev,
    images: [...prev.images, ...fileArray]
  }))

  // Queue uploads
  await queueImageUploads(fileArray)
}
```

### 2. Image Upload Queue Function

```typescript
const queueImageUploads = async (files: File[]) => {
  if (files.length === 0) return

  for (const file of files) {
    if (!(file instanceof File)) continue

    // Check if already uploading
    const existingId = uploadIdMapRef.current.get(file)
    if (existingId && uploadStatus[existingId]?.status !== 'error') {
      continue // Skip if already uploading or completed
    }

    // Generate unique upload ID
    const uploadId = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`
    uploadIdMapRef.current.set(file, uploadId)

    // Create AbortController for cancellation
    const abortController = new AbortController()
    abortControllersRef.current.set(uploadId, abortController)

    // Set initial status
    setUploadStatus(prev => ({
      ...prev,
      [uploadId]: { progress: 5, status: 'compressing' }
    }))

    try {
      // Step 1: Compress image
      const compression = await compressImageFile(file, {
        maxWidth: 1920,
        maxHeight: 1440,
        targetSize: 200 * 1024, // 200KB target
        quality: 0.85,
        convertToWebP: true
      })

      // Check if cancelled
      if (abortController.signal.aborted) {
        throw new Error('Upload cancelled')
      }

      // Step 2: Update status to uploading
      setUploadStatus(prev => ({
        ...prev,
        [uploadId]: { progress: 40, status: 'uploading' }
      }))

      // Step 3: Prepare FormData
      const payload = new FormData()
      payload.append('images', compression.file, compression.file.name)
      payload.append('listingId', user?.id || 'temp')

      // Step 4: Upload to Cloudinary
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: payload,
        signal: abortController.signal
      })

      const result = await response.json()

      // Step 5: Handle response
      if (response.ok && result.success && Array.isArray(result.images) && result.images.length > 0) {
        const uploadedImage = result.images[0]
        const preferredUrl = uploadedImage.mobile || 
                            uploadedImage.thumbnail || 
                            uploadedImage.secure_url || 
                            uploadedImage.url

        // Update form state with uploaded image
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, { 
            url: preferredUrl, 
            publicId: uploadedImage.publicId 
          }],
          images: prev.images.filter(img => img !== file)
        }))

        // Clean up upload status
        uploadIdMapRef.current.delete(file)
        setUploadStatus(prev => {
          const next = { ...prev }
          delete next[uploadId]
          return next
        })
      } else {
        // Handle upload error
        const errorMessage = result.error || 'Upload failed'
        setUploadStatus(prev => ({
          ...prev,
          [uploadId]: { progress: 100, status: 'error', message: errorMessage }
        }))
        showError(`Failed to upload ${file.name}: ${errorMessage}`, 5000)
      }
    } catch (error: any) {
      // Handle cancellation silently
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        uploadIdMapRef.current.delete(file)
        abortControllersRef.current.delete(uploadId)
        setUploadStatus(prev => {
          const next = { ...prev }
          delete next[uploadId]
          return next
        })
        return
      }

      // Handle actual errors
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
    }
  }
}
```

### 3. Image Compression Utility

**File:** `lib/utils/image-compression.ts`

```typescript
export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  targetSize: number // bytes
  quality: number // 0-1
  convertToWebP: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        const maxWidth = options.maxWidth
        const maxHeight = options.maxHeight
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        const outputFormat = options.convertToWebP ? 'image/webp' : file.type
        let quality = options.quality
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'))
              return
            }
            
            // If still too large, reduce quality
            if (blob.size > options.targetSize && quality > 0.1) {
              quality = Math.max(0.1, quality - 0.1)
              canvas.toBlob(
                (smallerBlob) => {
                  if (!smallerBlob) {
                    reject(new Error('Compression failed'))
                    return
                  }
                  const compressedFile = new File(
                    [smallerBlob],
                    file.name.replace(/\.[^/.]+$/, '') + (options.convertToWebP ? '.webp' : ''),
                    { type: outputFormat }
                  )
                  resolve({
                    file: compressedFile,
                    originalSize: file.size,
                    compressedSize: smallerBlob.size,
                    compressionRatio: smallerBlob.size / file.size
                  })
                },
                outputFormat,
                quality
              )
            } else {
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + (options.convertToWebP ? '.webp' : ''),
                { type: outputFormat }
              )
              resolve({
                file: compressedFile,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: blob.size / file.size
              })
            }
          },
          outputFormat,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
```

---

## Form Submission

### 1. Submit Handler

```typescript
const handleSubmit = async () => {
  // Validate form
  if (!validateForm()) return

  // Proceed with submission
  await submitListing()
}

const submitListing = async () => {
  setLoading(true)
  
  try {
    // Check authentication
    if (!user) {
      router.push('/?auth=true&redirect=/post')
      showWarning('Sign in required to post a listing.', 5000)
      setLoading(false)
      return
    }

    // Check for active uploads
    const hasActiveUploads = Object.values(uploadStatus).some(status =>
      ['pending', 'compressing', 'uploading'].includes(status.status)
    )

    if (hasActiveUploads || formData.images.length > 0) {
      showWarning('Wait for all image uploads to finish before submitting.', 5000)
      setLoading(false)
      return
    }

    // Check for images
    if (formData.imageUrls.length === 0) {
      showError('At least one image required', 5000)
      setLoading(false)
      return
    }

    // Extract image URLs
    const imageUrls = formData.imageUrls.map(img => img.url)

    // Prepare listing data
    const listingData = {
      title: formData.title,
      description: formData.description,
      vehicleType: formData.vehicleType,
      make: formData.make,
      customMake: formData.customMake,
      model: formData.model,
      customModel: formData.customModel,
      year: parseInt(formData.year || ''),
      mileage: parseInt(formData.mileage || '') || null,
      condition: formData.condition,
      fuelType: formData.fuelType,
      transmission: formData.transmission,
      engineCapacity: formData.engineCapacity ? parseInt(formData.engineCapacity) : null,
      trim: formData.trim,
      price: parseFloat(formData.price || ''),
      pricingType: formData.pricingType,
      negotiable: formData.negotiable,
      financeType: formData.financeType,
      outstandingBalance: formData.outstandingBalance ? parseFloat(formData.outstandingBalance) : null,
      monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : null,
      remainingTerm: formData.remainingTerm,
      askingPrice: formData.askingPrice ? parseFloat(formData.askingPrice) : null,
      district: formData.district,
      city: formData.city,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      email: formData.email,
      imageUrls: imageUrls
    }

    // Submit to API
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(listingData)
    })

    const result = await response.json()

    if (!response.ok) {
      // Handle validation errors
      if (response.status === 400 && result.errors) {
        setErrors(result.errors)
        showError('Validation failed. Please check the form.', 5000)
        return
      }

      // Handle duplicate errors
      if (response.status === 409) {
        showError(result.error || 'You already posted a similar listing recently.', 6000)
        return
      }

      // Handle server errors
      showError(result.error || 'Failed to create listing', 5000)
      return
    }

    // Success
    showSuccess('Listing created successfully!', 2000)
    localStorage.removeItem('vehiclePostDraft')
    
    // Redirect after delay
    setTimeout(() => {
      router.push('/profile?new=true')
    }, 3000)

  } catch (error: any) {
    showError(error?.message || 'Error posting listing. Try again later.', 7000)
  } finally {
    setLoading(false)
  }
}
```

---

## API Route Implementation

### Complete API Route

**File:** `app/api/listings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { validateListing, sanitizeListing } from '@/lib/validation/listing'
import { formatPhoneForStorage, normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. PARSE REQUEST BODY
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // 3. SANITIZE INPUT
    const sanitized = sanitizeListing({
      title: body.title,
      description: body.description,
      vehicleType: body.vehicleType,
      make: body.make,
      customMake: body.customMake,
      model: body.model,
      customModel: body.customModel,
      year: body.year,
      mileage: body.mileage,
      condition: body.condition,
      fuelType: body.fuelType,
      transmission: body.transmission,
      engineCapacity: body.engineCapacity,
      trim: body.trim,
      price: body.price,
      pricingType: body.pricingType || 'cash',
      negotiable: body.negotiable,
      financeType: body.financeType,
      outstandingBalance: body.outstandingBalance,
      monthlyPayment: body.monthlyPayment,
      remainingTerm: body.remainingTerm,
      askingPrice: body.askingPrice,
      district: body.district,
      city: body.city,
      phone: body.phone,
      whatsapp: body.whatsapp,
      email: body.email,
      imageUrls: body.imageUrls
    })

    // 4. VALIDATE
    const validation = validateListing(sanitized, user.id)

    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 })
    }

    // 5. PREPARE DATABASE PAYLOAD
    const actualMake = sanitized.make === 'Other' ? sanitized.customMake : sanitized.make
    const actualModel = sanitized.model === 'Other' ? sanitized.customModel : sanitized.model

    const year = sanitized.year ? parseInt(String(sanitized.year), 10) : null
    const mileage = sanitized.mileage ? parseInt(String(sanitized.mileage), 10) : null
    const engineCapacity = sanitized.engineCapacity ? parseInt(String(sanitized.engineCapacity), 10) : null

    // Determine final price
    let finalPrice: number | null
    if (sanitized.pricingType === 'finance' && sanitized.askingPrice) {
      finalPrice = parseFloat(String(sanitized.askingPrice))
    } else {
      finalPrice = parseFloat(String(sanitized.price))
    }

    // Format phone numbers
    const formattedPhone = formatPhoneForStorage(sanitized.phone || '', '94')
    const formattedWhatsApp = sanitized.whatsapp
      ? formatPhoneForStorage(sanitized.whatsapp, '94')
      : formattedPhone

    // Location string
    const location = `${sanitized.city}, ${sanitized.district}`

    // Build database payload
    const dbPayload: any = {
      user_id: user.id,
      title: sanitized.title,
      description: sanitized.description || null,
      details: sanitized.description || null,
      price: finalPrice,
      negotiable: sanitized.negotiable !== undefined ? sanitized.negotiable : true,
      make: actualMake,
      model: actualModel,
      year,
      mileage,
      fuel_type: sanitized.fuelType || null,
      transmission: sanitized.transmission || null,
      body_type: sanitized.vehicleType || null,
      vehicle_type: sanitized.vehicleType || null,
      engine_capacity: engineCapacity,
      grade: sanitized.trim || sanitized.grade || null,
      condition: sanitized.condition || null,
      location,
      city: sanitized.city,
      district: sanitized.district,
      phone: formattedPhone,
      whatsapp: formattedWhatsApp,
      email: sanitized.email || null,
      image_urls: sanitized.imageUrls || [],
      image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,
      primary_image_url: sanitized.imageUrls && sanitized.imageUrls.length > 0 ? sanitized.imageUrls[0] : null,
      status: 'pending',
      pricing_type: sanitized.pricingType || 'cash',
      finance_type: sanitized.pricingType === 'finance' && sanitized.financeType ? sanitized.financeType : null,
      outstanding_balance: sanitized.pricingType === 'finance' && sanitized.outstandingBalance
        ? parseFloat(String(sanitized.outstandingBalance))
        : null,
      monthly_payment: sanitized.pricingType === 'finance' && sanitized.monthlyPayment
        ? parseFloat(String(sanitized.monthlyPayment))
        : null,
      remaining_term: sanitized.pricingType === 'finance' && sanitized.remainingTerm ? sanitized.remainingTerm : null,
      asking_price: sanitized.pricingType === 'finance' && sanitized.askingPrice
        ? parseFloat(String(sanitized.askingPrice))
        : null,
      is_featured: false,
      is_top_spot: false,
      is_boosted: false,
      is_urgent: false
    }

    // 6. CHECK FOR DUPLICATES
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: duplicates } = await supabase
      .from('listings')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .eq('make', actualMake)
      .eq('model', actualModel)
      .eq('year', year)
      .gte('created_at', oneDayAgo)
      .neq('status', 'deleted')
      .limit(1)

    if (duplicates && duplicates.length > 0) {
      return NextResponse.json({
        error: 'You already posted a similar listing in the last 24 hours',
        duplicateId: duplicates[0].id
      }, { status: 409 })
    }

    // 7. INSERT INTO DATABASE
    const { data: newListing, error: insertError } = await supabase
      .from('listings')
      .insert([dbPayload])
      .select()
      .single()

    if (insertError) {
      logger.error('Database insert failed', insertError as Error)
      return NextResponse.json({
        error: 'Failed to create listing',
        details: insertError.message
      }, { status: 500 })
    }

    // 8. RETURN SUCCESS
    return NextResponse.json({
      success: true,
      listing: newListing,
      message: 'Listing created successfully'
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Create listing failed', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
```

---

## Validation & Sanitization

### Validation Function

**File:** `lib/validation/listing.ts`

```typescript
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateListing(input: ListingInput, userId: string): ValidationResult {
  const errors: Record<string, string> = {}

  // Title
  if (!input.title || input.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (input.title.length > 200) {
    errors.title = 'Title must be less than 200 characters'
  }

  // Description
  if (!input.description || input.description.trim().length === 0) {
    errors.description = 'Description is required'
  } else if (input.description.length > 5000) {
    errors.description = 'Description must be less than 5000 characters'
  }

  // Vehicle Type
  if (!input.vehicleType) {
    errors.vehicleType = 'Vehicle type is required'
  }

  // Make
  if (!input.make) {
    errors.make = 'Make is required'
  } else if (input.make === 'Other' && !input.customMake) {
    errors.make = 'Custom make name is required'
  }

  // Model (conditional)
  if (input.make && input.make !== 'Other') {
    if (!input.model) {
      errors.model = 'Model is required'
    } else if (input.model === 'Other' && !input.customModel) {
      errors.model = 'Custom model name is required'
    }
  }

  // Year
  if (!input.year) {
    errors.year = 'Year is required'
  } else {
    const yearNum = parseInt(String(input.year), 10)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      errors.year = 'Invalid year'
    }
  }

  // Price
  if (!input.price) {
    errors.price = 'Price is required'
  } else {
    const priceNum = parseFloat(String(input.price))
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Price must be a positive number'
    }
  }

  // Location
  if (!input.district) {
    errors.district = 'District is required'
  }
  if (!input.city) {
    errors.city = 'City is required'
  }

  // Phone
  if (!input.phone) {
    errors.phone = 'Phone number is required'
  } else if (!isValidPhone(input.phone)) {
    errors.phone = 'Invalid phone number format'
  }

  // Images
  if (!input.imageUrls || input.imageUrls.length === 0) {
    errors.images = 'At least one image is required'
  } else if (input.imageUrls.length > 10) {
    errors.images = 'Maximum 10 images allowed'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
```

### Sanitization Function

```typescript
export function sanitizeListing(input: ListingInput): ListingInput {
  return {
    title: clean(input.title),
    description: clean(input.description),
    vehicleType: clean(input.vehicleType),
    make: clean(input.make),
    customMake: clean(input.customMake),
    model: clean(input.model),
    customModel: clean(input.customModel),
    year: toInt(input.year),
    mileage: toInt(input.mileage),
    condition: clean(input.condition),
    fuelType: clean(input.fuelType),
    transmission: clean(input.transmission),
    engineCapacity: toInt(input.engineCapacity),
    trim: clean(input.trim),
    grade: clean(input.grade),
    price: toFloat(input.price),
    pricingType: input.pricingType || 'cash',
    negotiable: input.negotiable !== undefined ? input.negotiable : true,
    financeType: clean(input.financeType),
    outstandingBalance: toFloat(input.outstandingBalance),
    monthlyPayment: toFloat(input.monthlyPayment),
    remainingTerm: clean(input.remainingTerm),
    askingPrice: toFloat(input.askingPrice),
    district: clean(input.district),
    city: clean(input.city),
    phone: clean(input.phone),
    whatsapp: clean(input.whatsapp),
    email: clean(input.email)?.toLowerCase() || null,
    imageUrls: Array.isArray(input.imageUrls) ? input.imageUrls : []
  }
}

function clean(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  return str.replace(/<[^>]*>/g, '') // Remove HTML tags
}

function toInt(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return isNaN(num) ? null : Math.floor(num)
}

function toFloat(value: any): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : Number(value)
  return isNaN(num) ? null : num
}
```

---

## Error Handling

### Client-Side Error Handling

```typescript
// In submitListing function
if (!response.ok) {
  // Validation errors (400)
  if (response.status === 400 && result.errors) {
    setErrors(result.errors)
    
    // Scroll to first error
    const errorFields = Object.keys(result.errors)
    if (errorFields.length > 0) {
      setTimeout(() => {
        const element = document.querySelector(`[name="${errorFields[0]}"]`) as HTMLElement
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.focus()
        }
      }, 100)
    }
    
    showError('Validation failed. Please check the form.', 5000)
    return
  }

  // Duplicate errors (409)
  if (response.status === 409) {
    showError(result.error || 'You already posted a similar listing recently.', 6000)
    return
  }

  // Server errors (500)
  if (response.status === 500 && result.details) {
    showError(`Server error: ${result.details}`, 7000)
    return
  }

  // Generic error
  showError(result.error || 'Failed to create listing', 5000)
  return
}
```

### Server-Side Error Handling

```typescript
// In API route
try {
  // ... processing ...
} catch (error: any) {
  logger.error('Create listing failed', error)
  return NextResponse.json({
    error: 'Internal server error',
    details: error.message
  }, { status: 500 })
}
```

---

## Complete Code Examples

### Minimal Form Upload Example

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SimpleForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrls: [] as string[]
  })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle file upload
  const handleFileUpload = async (files: FileList) => {
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(file => {
      formData.append('images', file)
    })

    try {
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        const urls = result.images.map((img: any) => img.url)
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...urls]
        }))
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          imageUrls: formData.imageUrls
        })
      })

      const result = await response.json()
      if (response.ok) {
        router.push('/success')
      } else {
        alert(result.error || 'Submission failed')
      }
    } catch (error) {
      alert('Error submitting form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        placeholder="Title"
        required
      />
      
      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Description"
        required
      />

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        disabled={uploading}
      />

      {formData.imageUrls.map((url, i) => (
        <img key={i} src={url} alt={`Upload ${i + 1}`} style={{ width: 100, height: 100 }} />
      ))}

      <button type="submit" disabled={loading || uploading}>
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

---

## Key Features

1. **Client-Side Compression** - Reduces file size before upload
2. **Progress Tracking** - Real-time upload status
3. **Error Handling** - Comprehensive error messages
4. **Validation** - Client and server-side validation
5. **Sanitization** - Input cleaning and HTML removal
6. **Duplicate Prevention** - Checks for similar listings
7. **Image Management** - Stores URLs and publicIds
8. **Cancellation Support** - AbortController for uploads

---

## Best Practices

1. **Always validate** on both client and server
2. **Sanitize inputs** to prevent XSS
3. **Handle errors gracefully** with user-friendly messages
4. **Track upload progress** for better UX
5. **Compress images** before upload
6. **Store publicIds** for easy deletion
7. **Check for duplicates** before insertion
8. **Use transactions** for multi-step operations (if needed)

This implementation provides a complete, production-ready form upload system that can be replicated in other projects.





# Required Field Error Handling Implementation

Complete implementation of required field validation, error display, and auto-scroll functionality from the listing form.

## Table of Contents
1. [Validation Function](#validation-function)
2. [Error State Management](#error-state-management)
3. [Error Display Styling](#error-display-styling)
4. [Auto-Scroll Logic](#auto-scroll-logic)
5. [Field Configuration](#field-configuration)
6. [Complete Example](#complete-example)

---

## Validation Function

### Core Validation Logic

```typescript
const validateForm = (): boolean => {
  // Bypass all validation for privileged user (optional)
  if (user?.id === PRIVILEGED_USER_ID) {
    setErrors({})
    return true
  }

  const newErrors: Record<string, string> = {}

  // Vehicle type and title
  if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required'
  if (!formData.title) newErrors.title = 'Title is required'

  // Get field configuration for the selected vehicle type
  const fieldConfig = getFieldConfig(formData.vehicleType || '')

  // Make (always required)
  if (!formData.make) {
    newErrors.make = 'Make is required'
  } else if (formData.make === 'Other' && !formData.customMake) {
    newErrors.make = 'Custom make name is required'
  }

  // Model (only validate if field is shown)
  if (fieldConfig.showModel) {
    if (fieldConfig.modelRequired && !formData.model) {
      newErrors.model = 'Model is required'
    } else if (formData.model === 'Other' && !formData.customModel) {
      newErrors.model = 'Custom model name is required'
    }
  }

  // Year (only validate if field is shown)
  if (fieldConfig.showYear && fieldConfig.yearRequired && !formData.year) {
    newErrors.year = 'Year is required'
  }

  // Mileage (only validate if field is shown)
  if (fieldConfig.showMileage && fieldConfig.mileageRequired && !formData.mileage) {
    newErrors.mileage = 'Mileage is required'
  }

  // Trim (only validate if field is shown)
  if (fieldConfig.showTrim && fieldConfig.trimRequired && !formData.trim) {
    newErrors.trim = 'Trim/Grade is required'
  }

  // Condition
  if (!formData.condition) newErrors.condition = 'Vehicle condition is required'

  // Location
  if (!formData.district) newErrors.district = 'District is required'
  if (!formData.city) newErrors.city = 'City is required'

  // Pricing
  if (!formData.price) newErrors.price = 'Price is required'

  if (formData.pricingType === 'finance') {
    if (!formData.askingPrice) newErrors.askingPrice = 'Asking price is required'
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
```

---

## Error State Management

### State Declaration

```typescript
const [errors, setErrors] = useState<Record<string, string>>({})
```

### Clearing Errors

```typescript
// Clear all errors
setErrors({})

// Clear specific error
setErrors(prev => {
  const newErrors = { ...prev }
  delete newErrors.fieldName
  return newErrors
})
```

### Setting Errors

```typescript
// Set single error
setErrors({ fieldName: 'Error message' })

// Set multiple errors
setErrors({
  field1: 'Error 1',
  field2: 'Error 2'
})

// Merge with existing errors
setErrors(prev => ({
  ...prev,
  newField: 'New error'
}))
```

---

## Error Display Styling

### Red Text Error Messages

```tsx
{errors.fieldName && (
  <p className="text-red-600 text-sm mt-1">{errors.fieldName}</p>
)}
```

### Red Border on Input Fields

```tsx
<input
  name="fieldName"
  className={`w-full px-4 py-3 border rounded-lg ${
    errors.fieldName ? 'border-red-300' : 'border-gray-300'
  }`}
/>
```

### Required Field Indicator (Red Asterisk)

```tsx
<label className="block text-sm font-medium text-gray-700 mb-2">
  Field Name <span className="text-red-500">*</span>
</label>
```

### Complete Field Example

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    District <span className="text-red-500">*</span>
  </label>
  <select
    name="district"
    value={formData.district}
    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
      errors.district ? 'border-red-300' : 'border-gray-300'
    }`}
  >
    <option value="">Select District</option>
    {/* options */}
  </select>
  {errors.district && (
    <p className="text-red-600 text-sm mt-1">{errors.district}</p>
  )}
</div>
```

### Error Styling Classes

| Element | Class | Purpose |
|---------|-------|---------|
| Error text | `text-red-600 text-sm mt-1` | Red error message below field |
| Required asterisk | `text-red-500` | Red asterisk next to label |
| Error border | `border-red-300` | Red border on invalid input |
| Error background | `bg-red-50 border-red-200` | Light red background for error containers |

---

## Auto-Scroll Logic

### Basic Auto-Scroll

```typescript
// Auto-scroll to first error field
if (Object.keys(newErrors).length > 0) {
  const firstErrorField = Object.keys(newErrors)[0]
  
  setTimeout(() => {
    const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement
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
```

### Special Field Handling

```typescript
// Special handling for description field
if (firstErrorField === 'description') {
  setTimeout(() => {
    descriptionGeneratorRef.current?.expandAndFocus()
  }, 100)
} 
// Special handling for vehicleType (uses class selector)
else if (firstErrorField === 'vehicleType') {
  setTimeout(() => {
    const element = document.querySelector('.vehicle-type-section') as HTMLElement
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      })
    }
  }, 100)
}
```

### Scroll Options

```typescript
element.scrollIntoView({
  behavior: 'smooth',  // Smooth scrolling animation
  block: 'center',     // Vertical alignment: 'start' | 'center' | 'end' | 'nearest'
  inline: 'nearest'    // Horizontal alignment: 'start' | 'center' | 'end' | 'nearest'
})
```

### Focus After Scroll

```typescript
if (element.focus) element.focus()
```

---

## Field Configuration

### Field Configuration Utility

```typescript
// lib/utils/vehicleFieldConfig.ts

export interface VehicleFieldConfig {
  // Required field flags
  modelRequired: boolean
  yearRequired: boolean
  mileageRequired: boolean
  trimRequired: boolean
  
  // Field visibility flags
  showModel: boolean
  showYear: boolean
  showMileage: boolean
  showTrim: boolean
  showTransmission: boolean
  showFeatures: boolean
}

export function getFieldConfig(vehicleType: string): VehicleFieldConfig {
  const normalizedType = vehicleType?.toLowerCase().trim()
  
  switch (normalizedType) {
    case 'car':
      return {
        modelRequired: true,
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: true,
        showTransmission: true,
        showFeatures: true
      }
    // ... other vehicle types
    default:
      return {
        modelRequired: false,
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false,
        showTransmission: true,
        showFeatures: false
      }
  }
}

export function getRequiredFields(vehicleType: string): string[] {
  const config = getFieldConfig(vehicleType)
  const required: string[] = ['make', 'condition'] // Always required
  
  if (config.modelRequired) required.push('model')
  if (config.yearRequired) required.push('year')
  if (config.mileageRequired) required.push('mileage')
  if (config.trimRequired) required.push('trim')
  
  return required
}
```

---

## Complete Example

### Full Form Component with Error Handling

```tsx
'use client'

import { useState } from 'react'
import { getFieldConfig } from '@/lib/utils/vehicleFieldConfig'

interface FormData {
  vehicleType: string
  title: string
  make: string
  model: string
  year: string
  condition: string
  district: string
  city: string
  price: string
  description: string
  phone: string
  // ... other fields
}

export default function ListingForm() {
  const [formData, setFormData] = useState<FormData>({
    vehicleType: '',
    title: '',
    make: '',
    model: '',
    year: '',
    condition: '',
    district: '',
    city: '',
    price: '',
    description: '',
    phone: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Basic required fields
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required'
    if (!formData.title) newErrors.title = 'Title is required'
    if (!formData.make) newErrors.make = 'Make is required'
    if (!formData.condition) newErrors.condition = 'Vehicle condition is required'
    if (!formData.district) newErrors.district = 'District is required'
    if (!formData.city) newErrors.city = 'City is required'
    if (!formData.price) newErrors.price = 'Price is required'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.phone) newErrors.phone = 'Phone number is required'

    // Conditional validation based on vehicle type
    const fieldConfig = getFieldConfig(formData.vehicleType || '')
    
    if (fieldConfig.showModel && fieldConfig.modelRequired && !formData.model) {
      newErrors.model = 'Model is required'
    }
    
    if (fieldConfig.showYear && fieldConfig.yearRequired && !formData.year) {
      newErrors.year = 'Year is required'
    }

    setErrors(newErrors)

    // Auto-scroll to first error
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Submit form...
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vehicle Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vehicle Type <span className="text-red-500">*</span>
        </label>
        <select
          name="vehicleType"
          value={formData.vehicleType}
          onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg ${
            errors.vehicleType ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select Vehicle Type</option>
          <option value="car">Car</option>
          <option value="van">Van</option>
          {/* ... other options */}
        </select>
        {errors.vehicleType && (
          <p className="text-red-600 text-sm mt-1">{errors.vehicleType}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title}</p>
        )}
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          District <span className="text-red-500">*</span>
        </label>
        <select
          name="district"
          value={formData.district}
          onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg ${
            errors.district ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select District</option>
          {/* options */}
        </select>
        {errors.district && (
          <p className="text-red-600 text-sm mt-1">{errors.district}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  )
}
```

---

## Key Features

### 1. **Comprehensive Validation**
- Validates all required fields
- Conditional validation based on vehicle type
- Custom validation for special cases (e.g., "Other" options)

### 2. **Visual Error Indicators**
- Red asterisk (*) for required fields
- Red border on invalid inputs
- Red error text below fields
- Consistent styling across all fields

### 3. **Auto-Scroll Behavior**
- Automatically scrolls to first error field
- Smooth scrolling animation
- Centers error field in viewport
- Focuses the field after scrolling
- Special handling for complex fields

### 4. **User Experience**
- Clear error messages
- Immediate feedback on submit
- Non-intrusive error display
- Easy to identify and fix errors

---

## Usage Tips

1. **Always use `name` attribute** on form fields for auto-scroll to work
2. **Use consistent error state structure** (`Record<string, string>`)
3. **Clear errors** when user starts typing in a field
4. **Use setTimeout** for scroll to ensure DOM is updated
5. **Handle special cases** (like description generator) separately
6. **Use field configuration** for conditional validation

---

## Styling Reference

```css
/* Error Text */
.text-red-600 { color: #dc2626; }
.text-sm { font-size: 0.875rem; }
.mt-1 { margin-top: 0.25rem; }

/* Required Indicator */
.text-red-500 { color: #ef4444; }

/* Error Border */
.border-red-300 { border-color: #fca5a5; }

/* Normal Border */
.border-gray-300 { border-color: #d1d5db; }
```

---

This implementation provides a complete, production-ready error handling system that can be easily replicated in other projects.


/**
 * Vehicle Field Configuration Utility
 * 
 * Defines field requirements and visibility rules for each vehicle category.
 * This matches the exact logic from the form components to ensure consistency.
 */

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

/**
 * Get field configuration for a specific vehicle type
 * @param vehicleType - The vehicle category (car, van, bus, etc.)
 * @returns Field configuration object with requirements and visibility flags
 */
export function getFieldConfig(vehicleType: string): VehicleFieldConfig {
  const normalizedType = vehicleType?.toLowerCase().trim()
  
  switch (normalizedType) {
    case 'car':
      return {
        modelRequired: true,
        yearRequired: true,
        mileageRequired: true,
        trimRequired: true,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: true,
        showTransmission: true,
        showFeatures: true
      }
    
    case 'van':
      return {
        modelRequired: false, // Optional for vans
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false, // Optional for vans
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: true,
        showTransmission: true,
        showFeatures: true
      }
    
    case 'bus':
      return {
        modelRequired: false, // Optional for buses
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for buses
        showTransmission: true,
        showFeatures: true
      }
    
    case 'lorry':
      return {
        modelRequired: false, // Optional for lorries
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for lorries
        showTransmission: true,
        showFeatures: true
      }
    
    case 'motorcycle':
      return {
        modelRequired: false, // Optional for motorcycles
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for motorcycles
        showTransmission: false, // Hidden for motorcycles
        showFeatures: false // Hidden for motorcycles
      }
    
    case 'three-wheeler':
      return {
        modelRequired: false, // Optional for three-wheelers
        yearRequired: true,
        mileageRequired: true,
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for three-wheelers
        showTransmission: true,
        showFeatures: false // Hidden for three-wheelers
      }
    
    case 'bicycle':
      return {
        modelRequired: false,
        yearRequired: false, // Hidden for bicycles
        mileageRequired: false, // Hidden for bicycles
        trimRequired: false,
        showModel: false, // Hidden for bicycles
        showYear: false, // Hidden for bicycles
        showMileage: false, // Hidden for bicycles
        showTrim: false, // Hidden for bicycles
        showTransmission: false, // Hidden for bicycles
        showFeatures: false // Hidden for bicycles
      }
    
    case 'plant-machinery':
      return {
        modelRequired: false, // Optional for plant machinery
        yearRequired: true,
        mileageRequired: false, // Optional for plant machinery
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for plant machinery
        showTransmission: true,
        showFeatures: false // Hidden for plant machinery
      }
    
    case 'tractor':
      return {
        modelRequired: false, // Optional for tractors
        yearRequired: true,
        mileageRequired: false, // Optional for tractors
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for tractors
        showTransmission: true,
        showFeatures: false // Hidden for tractors
      }
    
    case 'boat':
      return {
        modelRequired: false, // Optional for boats
        yearRequired: true,
        mileageRequired: false, // Optional for boats
        trimRequired: false,
        showModel: true,
        showYear: true,
        showMileage: true,
        showTrim: false, // Hidden for boats
        showTransmission: false, // Hidden for boats
        showFeatures: false // Hidden for boats
      }
    
    default:
      // Default to most permissive configuration for unknown types
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

/**
 * Get list of required field names for a vehicle type
 * Useful for validation error messages
 */
export function getRequiredFields(vehicleType: string): string[] {
  const config = getFieldConfig(vehicleType)
  const required: string[] = ['make', 'condition'] // Always required
  
  if (config.modelRequired) required.push('model')
  if (config.yearRequired) required.push('year')
  if (config.mileageRequired) required.push('mileage')
  if (config.trimRequired) required.push('trim')
  
  return required
}


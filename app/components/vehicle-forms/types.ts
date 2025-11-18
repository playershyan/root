export interface BaseVehicleFormData {
  vehicleType: string
  title: string
  make: string
  customMake?: string
  model?: string
  customModel?: string
  year?: string
  mileage?: string
  condition: string
  engineCapacity?: string
  fuelType?: string
  transmission?: string
  trim?: string
  grade?: string
  district: string
  city: string
  pricingType?: 'cash' | 'finance'
  price: string
  negotiable: boolean
  financeType?: string
  outstandingBalance?: string
  monthlyPayment?: string
  remainingTerm?: string
  askingPrice?: string
  features?: string[]
  images: File[]
  imageUrls: Array<{ url: string; publicId: string }>
  description: string
  phone: string
  whatsapp: string
  email: string
}

export interface VehicleFormProps {
  formData: BaseVehicleFormData
  setFormData: React.Dispatch<React.SetStateAction<BaseVehicleFormData>>
  errors: Record<string, string>
  getMakeOptions: () => any[]
  getModelOptions: () => string[]
}

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG', 'Plug-in Hybrid']

// Function to get fuel types based on vehicle type
export const getFuelTypesByVehicleType = (vehicleType: string): string[] => {
  switch (vehicleType) {
    case 'motorcycle':
      return ['Petrol', 'Electric']
    case 'car':
      return ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid', 'Other']
    case 'van':
      return ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'Other']
    case 'truck':
    case 'lorry':
    case 'bus':
      return ['Diesel', 'Petrol', 'Electric', 'CNG', 'LPG']
    case 'three-wheeler':
      return ['Petrol', 'Electric']
    case 'bicycle':
      return ['Electric'] // Only electric bicycles are typically listed
    case 'boat':
      return ['Petrol', 'Diesel', 'Electric', 'CNG', 'LPG']
    case 'tractor':
    case 'plant-machinery':
      return ['Diesel', 'Petrol', 'CNG', 'LPG']
    default:
      return FUEL_TYPES
  }
}

export const TRANSMISSION_TYPES = ['Manual', 'Automatic', 'CVT', 'Tiptronic']
export const VEHICLE_CONDITIONS = ['New', 'Used', 'Reconditioned']
export const COLORS = ['White', 'Black', 'Silver', 'Gray', 'Blue', 'Red', 'Brown', 'Green', 'Pearl', 'Other']

export const SAFETY_FEATURES = [
  'Multiple Airbags', 'ABS Brakes', 'Stability Control', 
  'Traction Control', 'Lane Departure Warning', 'Blind Spot Detection',
  'Rear Cross Traffic Alert', 'Emergency Braking'
]

export const TECH_FEATURES = [
  'Touch Display', 'Bluetooth', 'USB Ports', 'Backup Camera',
  'Parking Sensors', 'Wireless Charging', 'Premium Audio',
  'Apple CarPlay', 'Android Auto', 'Navigation System'
]

export const COMFORT_FEATURES = [
  'Climate Control', 'Power Windows', 'Power Mirrors', 
  'Keyless Entry', 'Push Start', 'Cruise Control',
  'Leather Seats', 'Sunroof', 'Power Seats'
]
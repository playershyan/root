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
  color?: string
  trim?: string
  district: string
  city: string
  pricingType?: 'cash' | 'finance'
  price: string
  negotiable: boolean
  financeType?: string
  financeProvider?: string
  originalAmount?: string
  outstandingBalance?: string
  monthlyPayment?: string
  remainingTerm?: string
  earlySettlement?: string
  askingPrice?: string
  features?: string[]
  images: File[]
  imageUrls: string[]
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

export const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG', 'LPG']
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
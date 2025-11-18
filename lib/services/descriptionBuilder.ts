import { getFieldConfig } from '@/lib/utils/vehicleFieldConfig'

export type PricingType = 'cash' | 'finance'

export interface ListingDescriptionInput {
  title?: string
  vehicleType?: string
  make?: string
  customMake?: string
  model?: string
  customModel?: string
  trim?: string
  year?: string
  registrationYear?: string
  mileage?: string | number
  condition?: string
  vehicleConditionDetails?: string
  engineCapacity?: string | number
  fuelType?: string
  transmission?: string
  color?: string
  interiorColor?: string
  previousOwners?: string | number
  serviceRecordsAvailable?: boolean
  pricingType?: PricingType
  price?: string | number
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: string | number
  monthlyPayment?: string | number
  remainingTerm?: string | number
  askingPrice?: string | number
  city?: string
  district?: string
  features?: string[]
  phone?: string
  whatsapp?: string
  email?: string
  preferredContact?: string
  bestTimeToCall?: string
}

const toCleanString = (value?: string | number | null) => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : ''
  return value.trim()
}

const toInteger = (value?: string | number): number => {
  if (value === undefined || value === null) return NaN
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : NaN
}

const formatCurrency = (value: number) =>
  Number.isFinite(value) && value > 0 ? `Rs. ${value.toLocaleString('en-LK')}` : ''

export interface DescriptionResult {
  description: string
  linesCount: number
}

export const buildListingDescription = (input: ListingDescriptionInput): DescriptionResult => {
  // Get field configuration based on vehicle type
  const fieldConfig = getFieldConfig(input.vehicleType || '')
  
  const resolvedMake = input.make === 'Other' ? input.customMake : input.make
  const resolvedModel = input.model === 'Other' ? input.customModel : input.model
  const resolvedTrim = toCleanString(input.trim)
  const resolvedYear = toCleanString(input.year)

  const mileageNumber = toInteger(input.mileage)
  const engineCapacityNumber = toInteger(input.engineCapacity)
  const outstandingBalanceNumber = toInteger(input.outstandingBalance)
  const monthlyPaymentNumber = toInteger(input.monthlyPayment)
  const remainingTermNumber = toInteger(input.remainingTerm)
  const askingPriceNumber = toInteger(input.askingPrice)
  const priceNumber = toInteger(input.price)

  const items: string[] = []

  // Title
  if (input.title) items.push(toCleanString(input.title))

  // Make
  if (resolvedMake) items.push(`Make: ${resolvedMake}`)
  
  // Model: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showModel && resolvedModel) {
    items.push(`Model: ${resolvedModel}`)
  }
  
  // Trim: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showTrim && resolvedTrim) {
    items.push(`Trim / Grade: ${resolvedTrim}`)
  }

  // Year: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showYear && resolvedYear) {
    items.push(`Year of Manufacture: ${resolvedYear}`)
  }

  // Mileage: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showMileage && Number.isFinite(mileageNumber) && mileageNumber > 0) {
    items.push(`Mileage: ${mileageNumber.toLocaleString('en-LK')} km`)
  }

  // Condition
  if (input.condition) {
    items.push(`Condition: ${input.condition}`)
  }

  // Engine Capacity
  if (Number.isFinite(engineCapacityNumber) && engineCapacityNumber > 0) {
    items.push(`Engine Capacity: ${engineCapacityNumber.toLocaleString('en-LK')} cc`)
  }

  // Fuel Type
  if (input.fuelType) {
    items.push(`Fuel Type: ${input.fuelType}`)
  }

  // Transmission: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showTransmission && input.transmission) {
    items.push(`Transmission: ${input.transmission}`)
  }

  // Key Features: only include if field is visible for this vehicle type and value exists
  if (fieldConfig.showFeatures && input.features?.length) {
    items.push(`Key Features: ${input.features.join(', ')}`)
  }

  // Service Records
  if (input.serviceRecordsAvailable === true) {
    items.push('Service Records Available: Yes')
  }

  // Pricing
  if (input.pricingType === 'cash') {
    const currency = formatCurrency(priceNumber)
    if (currency) items.push(`Price: ${currency}`)
  } else if (input.pricingType === 'finance') {
    const askingPrice = formatCurrency(askingPriceNumber)
    if (askingPrice) items.push(`Asking Price: ${askingPrice}`)

    const outstandingBalance = formatCurrency(outstandingBalanceNumber)
    if (outstandingBalance) items.push(`Outstanding Balance: ${outstandingBalance}`)

    const monthlyPayment = formatCurrency(monthlyPaymentNumber)
    if (monthlyPayment) items.push(`Monthly Payment: ${monthlyPayment}`)

    if (Number.isFinite(remainingTermNumber) && remainingTermNumber > 0) {
      items.push(`Remaining Term: ${remainingTermNumber} months`)
    }

    if (input.financeType) {
      items.push(`Finance Type: ${input.financeType}`)
    }
  }

  // Negotiable
  if (input.negotiable) {
    items.push('Negotiable: Yes')
  }

  // Location
  if (input.city || input.district) {
    const locationParts = [input.city, input.district].filter(Boolean)
    items.push(`Location: ${locationParts.join(', ')}`)
  }

  // Join all items with single line breaks
  const description = items.length > 0 
    ? items.join('\n').trim()
    : 'Listing details are not complete yet.'

  // Calculate total line count (including section separators)
  const linesCount = description.split('\n').filter(line => line.trim().length > 0).length

  return {
    description,
    linesCount
  }
}


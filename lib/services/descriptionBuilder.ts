import { formatPhoneDisplay } from '@/lib/utils/phoneFormatter'

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
  const resolvedMake = input.make === 'Other' ? input.customMake : input.make
  const resolvedModel = input.model === 'Other' ? input.customModel : input.model
  const resolvedTrim = toCleanString(input.trim)
  const resolvedYear = toCleanString(input.year)
  const resolvedRegYear = toCleanString(input.registrationYear)

  const mileageNumber = toInteger(input.mileage)
  const engineCapacityNumber = toInteger(input.engineCapacity)
  const outstandingBalanceNumber = toInteger(input.outstandingBalance)
  const monthlyPaymentNumber = toInteger(input.monthlyPayment)
  const remainingTermNumber = toInteger(input.remainingTerm)
  const askingPriceNumber = toInteger(input.askingPrice)
  const priceNumber = toInteger(input.price)
  const previousOwnersNumber = toInteger(input.previousOwners)

  const lines: string[] = []

  if (input.title) lines.push(`Title: ${toCleanString(input.title)}`)
  if (input.vehicleType) lines.push(`Vehicle Type: ${input.vehicleType}`)

  if (resolvedMake) lines.push(`Make: ${resolvedMake}`)
  if (resolvedModel) lines.push(`Model: ${resolvedModel}`)
  if (resolvedTrim) lines.push(`Trim / Grade: ${resolvedTrim}`)

  if (resolvedYear) {
    let yearLine = `Year of Manufacture: ${resolvedYear}`
    if (resolvedRegYear && resolvedRegYear !== resolvedYear) {
      yearLine += ` | Registration Year: ${resolvedRegYear}`
    } else if (resolvedRegYear && resolvedRegYear === resolvedYear) {
      yearLine += ` | Registered: ${resolvedRegYear}`
    }
    lines.push(yearLine)
  } else if (resolvedRegYear) {
    lines.push(`Registration Year: ${resolvedRegYear}`)
  }

  if (Number.isFinite(mileageNumber) && mileageNumber > 0) {
    lines.push(`Mileage: ${mileageNumber.toLocaleString('en-LK')} km`)
  }

  if (input.condition) lines.push(`Condition: ${input.condition}`)
  if (input.vehicleConditionDetails) {
    lines.push(`Condition Detail: ${input.vehicleConditionDetails}`)
  }

  if (Number.isFinite(engineCapacityNumber) && engineCapacityNumber > 0) {
    lines.push(`Engine Capacity: ${engineCapacityNumber.toLocaleString('en-LK')} cc`)
  }
  if (input.fuelType) lines.push(`Fuel Type: ${input.fuelType}`)
  if (input.transmission) lines.push(`Transmission: ${input.transmission}`)

  if (input.color) lines.push(`Exterior Color: ${input.color}`)
  if (input.interiorColor) lines.push(`Interior Color: ${input.interiorColor}`)

  if (Number.isFinite(previousOwnersNumber) && previousOwnersNumber > 0) {
    lines.push(`Previous Owners: ${previousOwnersNumber}`)
  } else if (typeof input.previousOwners === 'string' && input.previousOwners.trim().length > 0) {
    lines.push(`Previous Owners: ${input.previousOwners}`)
  }

  if (input.serviceRecordsAvailable === true) {
    lines.push('Service Records Available: Yes')
  }

  if (input.pricingType === 'cash') {
    const currency = formatCurrency(priceNumber)
    if (currency) lines.push(`Price: ${currency}`)
  } else if (input.pricingType === 'finance') {
    const askingPrice = formatCurrency(askingPriceNumber)
    if (askingPrice) lines.push(`Asking Price: ${askingPrice}`)

    const outstandingBalance = formatCurrency(outstandingBalanceNumber)
    if (outstandingBalance) lines.push(`Outstanding Balance: ${outstandingBalance}`)

    const monthlyPayment = formatCurrency(monthlyPaymentNumber)
    if (monthlyPayment) lines.push(`Monthly Payment: ${monthlyPayment}`)

    if (Number.isFinite(remainingTermNumber) && remainingTermNumber > 0) {
      lines.push(`Remaining Term: ${remainingTermNumber} months`)
    }

    if (input.financeType) {
      lines.push(`Finance Type: ${input.financeType}`)
    }
  }

  if (input.negotiable) {
    lines.push('Negotiable: Yes')
  }

  if (input.city || input.district) {
    const locationParts = [input.city, input.district].filter(Boolean)
    lines.push(`Location: ${locationParts.join(', ')}`)
  }

  if (input.features?.length) {
    lines.push(`Key Features: ${input.features.join(', ')}`)
  }

  if (input.phone) lines.push(`Phone: ${formatPhoneDisplay(input.phone)}`)
  if (input.whatsapp) lines.push(`WhatsApp: ${formatPhoneDisplay(input.whatsapp)}`)
  if (input.email) lines.push(`Email: ${input.email}`)
  if (input.preferredContact) {
    lines.push(`Preferred Contact: ${input.preferredContact}`)
  }
  if (input.bestTimeToCall) {
    lines.push(`Best Time to Contact: ${input.bestTimeToCall}`)
  }

  if (!lines.length) {
    lines.push('Listing details are not complete yet.')
  }

  const description = lines.join('\n').trim()

  return {
    description,
    linesCount: lines.length
  }
}


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

  const mileageNumber = toInteger(input.mileage)
  const engineCapacityNumber = toInteger(input.engineCapacity)
  const outstandingBalanceNumber = toInteger(input.outstandingBalance)
  const monthlyPaymentNumber = toInteger(input.monthlyPayment)
  const remainingTermNumber = toInteger(input.remainingTerm)
  const askingPriceNumber = toInteger(input.askingPrice)
  const priceNumber = toInteger(input.price)

  const sections: string[] = []

  // Section 1: Title, Make/Model/Trim, Year
  const section1: string[] = []
  if (input.title) section1.push(toCleanString(input.title))

  if (resolvedMake) section1.push(`Make: ${resolvedMake}`)
  if (resolvedModel) section1.push(`Model: ${resolvedModel}`)
  if (resolvedTrim) section1.push(`Trim / Grade: ${resolvedTrim}`)

  if (resolvedYear) {
    section1.push(`Year of Manufacture: ${resolvedYear}`)
  }

  if (section1.length > 0) {
    sections.push(section1.join('\n'))
  }

  // Section 2: Mileage, Condition
  const section2: string[] = []
  if (Number.isFinite(mileageNumber) && mileageNumber > 0) {
    section2.push(`Mileage: ${mileageNumber.toLocaleString('en-LK')} km`)
  }

  if (input.condition) {
    section2.push(`Condition: ${input.condition}`)
  }

  if (section2.length > 0) {
    sections.push(section2.join('\n'))
  }

  // Section 3: Engine Capacity, Fuel Type, Transmission (on separate lines)
  const section3: string[] = []
  if (Number.isFinite(engineCapacityNumber) && engineCapacityNumber > 0) {
    section3.push(`Engine Capacity: ${engineCapacityNumber.toLocaleString('en-LK')} cc`)
  }
  if (input.fuelType) {
    section3.push(`Fuel Type: ${input.fuelType}`)
  }
  if (input.transmission) {
    section3.push(`Transmission: ${input.transmission}`)
  }

  if (section3.length > 0) {
    sections.push(section3.join('\n'))
  }

  // Section 4: Key Features, Service Records
  const section4: string[] = []
  if (input.features?.length) {
    section4.push(`Key Features: ${input.features.join(', ')}`)
  }

  if (input.serviceRecordsAvailable === true) {
    section4.push('Service Records Available: Yes')
  }

  if (section4.length > 0) {
    sections.push(section4.join('\n'))
  }

  // Section 5: Pricing, Negotiable, Location
  const section5: string[] = []
  if (input.pricingType === 'cash') {
    const currency = formatCurrency(priceNumber)
    if (currency) section5.push(`Price: ${currency}`)
  } else if (input.pricingType === 'finance') {
    const askingPrice = formatCurrency(askingPriceNumber)
    if (askingPrice) section5.push(`Asking Price: ${askingPrice}`)

    const outstandingBalance = formatCurrency(outstandingBalanceNumber)
    if (outstandingBalance) section5.push(`Outstanding Balance: ${outstandingBalance}`)

    const monthlyPayment = formatCurrency(monthlyPaymentNumber)
    if (monthlyPayment) section5.push(`Monthly Payment: ${monthlyPayment}`)

    if (Number.isFinite(remainingTermNumber) && remainingTermNumber > 0) {
      section5.push(`Remaining Term: ${remainingTermNumber} months`)
    }

    if (input.financeType) {
      section5.push(`Finance Type: ${input.financeType}`)
    }
  }

  if (input.negotiable) {
    section5.push('Negotiable: Yes')
  }

  if (input.city || input.district) {
    const locationParts = [input.city, input.district].filter(Boolean)
    section5.push(`Location: ${locationParts.join(', ')}`)
  }

  if (section5.length > 0) {
    sections.push(section5.join('\n'))
  }

  // Join sections with double line breaks for visual separation
  const description = sections.length > 0 
    ? sections.join('\n\n').trim()
    : 'Listing details are not complete yet.'

  // Calculate total line count (including section separators)
  const linesCount = description.split('\n').filter(line => line.trim().length > 0).length

  return {
    description,
    linesCount
  }
}


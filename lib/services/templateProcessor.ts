import { supabase } from '@/lib/supabase'

export interface FormDataForTemplate {
  // Vehicle Identity (Tier 1)
  vehicleType?: string
  make?: string
  customMake?: string
  model?: string
  customModel?: string
  trim?: string // Grade
  year?: string // YoM (Year of Manufacture)
  registrationYear?: string // YoR (Year of Registration)

  // Core Specifications (Tier 2)
  condition?: string
  engineCapacity?: string
  fuelType?: string
  transmission?: string
  mileage?: string

  // Visual & Details (Tier 2)
  color?: string
  interiorColor?: string

  // Ownership & History (Tier 3)
  previousOwners?: string
  vehicleConditionDetails?: string // pristine/mint
  serviceRecordsAvailable?: boolean

  // Pricing (Tier 3)
  pricingType?: string
  price?: string
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: string
  monthlyPayment?: string
  remainingTerm?: string
  askingPrice?: string

  // Location (Tier 4)
  district?: string
  city?: string

  // Features (Tier 4)
  features?: string[]

  // Additional fields
  title?: string
  includingFinanceCompanies?: boolean
}

export interface ProcessedTemplate {
  id: number
  content: string
  originalTemplate: string
  usageCount: number
}

export class TemplateProcessor {
  /**
   * Get a random template and populate it with form data
   */
  static async generateDescription(
    formData: FormDataForTemplate
  ): Promise<ProcessedTemplate> {
    // Get available templates
    const { data: templates, error } = await supabase
      .from('description_templates')
      .select('*')
      .eq('is_active', true)

    if (error || !templates || templates.length === 0) {
      throw new Error('No templates available. Please contact administrator.')
    }

    // Select random template
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

    // Process template with form data
    const processedContent = this.processTemplate(randomTemplate.template_content, formData)

    // Update usage count
    await supabase
      .from('description_templates')
      .update({ usage_count: (randomTemplate.usage_count || 0) + 1 })
      .eq('id', randomTemplate.id)

    return {
      id: randomTemplate.id,
      content: processedContent,
      originalTemplate: randomTemplate.template_content,
      usageCount: (randomTemplate.usage_count || 0) + 1
    }
  }

  /**
   * Process template string with form data
   */
  static processTemplate(template: string, data: FormDataForTemplate): string {
    let processed = template

    // Define variable mappings - use empty strings for missing values to trigger line removal
    const mappings: Record<string, any> = {
      // Tier 1: Vehicle Identity
      'Vehicle Type': data.vehicleType || '',
      'Make': data.customMake || data.make || 'Vehicle',
      'Model': data.customModel || data.model || '',
      'Grade': data.trim || '',
      'YoM': data.year || '',
      'YoR': data.registrationYear || data.year || '',

      // Tier 2: Core Specifications
      'Condition': data.condition || '',
      'Engine Capacity': data.engineCapacity ? `${data.engineCapacity}cc` : '',
      'Fuel Type': data.fuelType || '',
      'Transmission': data.transmission || '',
      'Mileage': data.mileage && data.vehicleType !== 'bicycle' ? `${parseInt(data.mileage).toLocaleString()} km` : '',

      // Tier 2: Visual & Details
      'Color': data.color || '',
      'Exterior Color': data.color || '',
      'Interior Color': data.interiorColor || '',

      // Tier 3: Ownership & History
      'No. of previous owners': parseInt(data.previousOwners || '0') || 0,
      'Previous Owners': parseInt(data.previousOwners || '0') || 0,
      'Vehicle condition': data.vehicleConditionDetails ? this.formatCondition(data.vehicleConditionDetails) : '',
      'Service records available': data.serviceRecordsAvailable === true,

      // Tier 3: Pricing
      'Pricing Type': data.pricingType || '',
      'Price': data.price ? `Rs. ${parseInt(data.price).toLocaleString()}` : '',
      'Negotiable': data.negotiable || false,
      'Finance Type': data.financeType || '',
      'Outstanding Balance': data.outstandingBalance ? `Rs. ${parseInt(data.outstandingBalance).toLocaleString()}` : '',
      'Monthly Payment': data.monthlyPayment ? `Rs. ${parseInt(data.monthlyPayment).toLocaleString()}` : '',
      'Remaining Term': data.remainingTerm ? `${data.remainingTerm} months` : '',
      'Asking Price': data.askingPrice ? `Rs. ${parseInt(data.askingPrice).toLocaleString()}` : '',

      // Tier 4: Location
      'District': data.district || '',
      'City': data.city || '',
      'Location': data.city && data.district ? `${data.city}, ${data.district}` : data.city || data.district || '',

      // Tier 4: Features
      'Features': data.features && data.features.length > 0 ? data.features.join(', ') : ''
    }

    // Process simple variable replacements
    for (const [key, value] of Object.entries(mappings)) {
      const regex = new RegExp(`{{\\s*${this.escapeRegex(key)}\\s*}}`, 'g')
      processed = processed.replace(regex, String(value))
    }

    // Process conditional statements
    processed = this.processConditionals(processed, mappings)

    // Clean up any remaining unprocessed variables
    processed = this.cleanupUnprocessedVariables(processed)

    // Format the final output
    processed = this.formatOutput(processed)

    return processed
  }

  /**
   * Process conditional logic in templates
   */
  private static processConditionals(template: string, data: Record<string, any>): string {
    let processed = template

    // Process {{#if condition}}text{{else}}alt{{/if}} patterns
    const ifElseRegex = /{{#if\s+([^}]+)}}(.*?)(?:{{else}}(.*?))?{{\/if}}/gs
    processed = processed.replace(ifElseRegex, (match, condition, ifTrue, ifFalse = '') => {
      const isTrue = this.evaluateCondition(condition, data)
      return isTrue ? ifTrue : ifFalse
    })

    // Process simple boolean conditions {{#if Service records available}}text{{/if}}
    const simpleBooleanRegex = /{{#if\s+([^}]+)}}(.*?){{\/if}}/gs
    processed = processed.replace(simpleBooleanRegex, (match, condition, text) => {
      const isTrue = this.evaluateCondition(condition, data)
      return isTrue ? text : ''
    })

    // Process greater than conditions for pluralization (owners > 1)
    const gtRegex = /{{#if\s+\(gt\s+([^)]+)\s+(\d+)\)}}(.*?){{\/if}}/gs
    processed = processed.replace(gtRegex, (match, variable, threshold, text) => {
      const variableName = variable.trim()
      const value = data[variableName] || 0
      const numValue = parseInt(String(value))
      const thresholdValue = parseInt(threshold)

      // For owners, if no value or 0, don't show plural
      if (variableName === 'No. of previous owners' && (!value || numValue === 0)) {
        return ''
      }

      const isGreater = numValue > thresholdValue
      return isGreater ? text : ''
    })

    return processed
  }

  /**
   * Evaluate conditional expressions
   */
  private static evaluateCondition(condition: string, data: Record<string, any>): boolean {
    const trimmed = condition.trim()

    // Handle greater than conditions: (gt variable number)
    const gtMatch = trimmed.match(/\(gt\s+(.+?)\s+(\d+)\)/)
    if (gtMatch) {
      const variable = gtMatch[1].trim()
      const threshold = parseInt(gtMatch[2])
      const value = data[variable] || 0
      return parseInt(String(value)) > threshold
    }

    // Handle simple variable checks
    if (data.hasOwnProperty(trimmed)) {
      const value = data[trimmed]
      return Boolean(value)
    }

    return false
  }

  /**
   * Format condition values for display
   */
  private static formatCondition(condition?: string): string {
    switch (condition) {
      case 'pristine':
        return 'Pristine Condition'
      case 'mint':
        return 'Mint Condition'
      default:
        return 'Good Condition'
    }
  }

  /**
   * Clean up any unprocessed template variables and remove empty lines
   */
  private static cleanupUnprocessedVariables(text: string): string {
    // Remove any remaining {{variable}} patterns
    let cleaned = text.replace(/{{[^}]+}}/g, '')

    // Remove lines that contain only empty values or "N/A"
    // This handles cases like "Interior: " or "Interior: N/A" or "Interior: Standard"
    const lines = cleaned.split('\n')
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()

      // Skip empty lines
      if (!trimmed) return false

      // Special case: Remove "0 owner" lines (when no previous owners data)
      if (trimmed.match(/^0 owner[s]?$/)) {
        return false
      }

      // Check if line has a colon (indicating a field: value format)
      if (trimmed.includes(':')) {
        const parts = trimmed.split(':')
        if (parts.length >= 2) {
          const value = parts.slice(1).join(':').trim()

          // Remove lines with empty, N/A, or default values
          if (!value ||
              value === 'N/A' ||
              value === 'Standard' ||
              value === 'Not specified' ||
              value === '') {
            return false
          }
        }
      }

      return true
    })

    return filteredLines.join('\n')
  }

  /**
   * Format the final output with structured layout (plain text without markdown)
   */
  private static formatOutput(text: string): string {
    return text
      // Remove extra whitespace but preserve line breaks
      .replace(/[ \t]+/g, ' ')
      // Remove leading/trailing whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Remove empty lines
      .replace(/\n\s*\n/g, '\n')
      // Remove leading/trailing whitespace
      .trim()
      // Fix punctuation spacing
      .replace(/\s+([,.!?])/g, '$1')
      // Ensure proper sentence spacing
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Remove multiple consecutive spaces
      .replace(/\s{2,}/g, ' ')
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Get template statistics
   */
  static async getTemplateStats() {
    const { data: templates } = await supabase
      .from('description_templates')
      .select('usage_count, is_active')
      .eq('is_active', true)

    if (!templates) return null

    const stats = {
      totalTemplates: templates.length,
      totalUsage: templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)
    }

    return stats
  }

  /**
   * Validate template syntax
   */
  static validateTemplate(templateContent: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for balanced conditional blocks
    const ifCount = (templateContent.match(/{{#if/g) || []).length
    const endifCount = (templateContent.match(/{{\/if}}/g) || []).length

    if (ifCount !== endifCount) {
      errors.push('Unbalanced conditional blocks ({{#if}} and {{/if}})')
    }

    // Check for valid variable syntax
    const variablePattern = /{{([^}]+)}}/g
    let match
    while ((match = variablePattern.exec(templateContent)) !== null) {
      const variable = match[1].trim()

      // Skip conditional keywords
      if (variable.startsWith('#if') || variable.startsWith('/if') || variable === 'else') {
        continue
      }

      // Check if variable is in allowed list
      const allowedVariables = [
        // Tier 1: Vehicle Identity
        'Vehicle Type', 'Make', 'Model', 'Grade', 'YoM', 'YoR',

        // Tier 2: Core Specifications
        'Condition', 'Engine Capacity', 'Fuel Type', 'Transmission', 'Mileage',

        // Tier 2: Visual & Details
        'Color', 'Exterior Color', 'Interior Color', 'Interior color',

        // Tier 3: Ownership & History
        'No. of previous owners', 'Previous Owners', 'Vehicle condition', 'Service records available',

        // Tier 3: Pricing
        'Pricing Type', 'Price', 'Negotiable', 'Finance Type', 'Outstanding Balance',
        'Monthly Payment', 'Remaining Term', 'Asking Price',

        // Tier 4: Location
        'District', 'City', 'Location',

        // Tier 4: Features
        'Features'
      ]

      if (!allowedVariables.includes(variable) && !variable.includes('gt ')) {
        errors.push(`Unknown variable: ${variable}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
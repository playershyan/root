import { toast } from 'sonner'

export interface ErrorResponse {
  error: string
  message?: string
  status?: number
  details?: any
}

export class APIError extends Error {
  status: number
  details?: any

  constructor(message: string, status: number = 500, details?: any) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error: 'Network error',
      message: response.statusText,
      status: response.status
    }))
    
    throw new APIError(
      errorData.message || errorData.error || 'Something went wrong',
      response.status,
      errorData.details
    )
  }
  
  return response.json()
}

export function handleError(error: unknown, fallbackMessage = 'An unexpected error occurred') {
  console.error('Error:', error)
  
  if (error instanceof APIError) {
    toast.error(error.message)
    return error.message
  }
  
  if (error instanceof Error) {
    toast.error(error.message)
    return error.message
  }
  
  toast.error(fallbackMessage)
  return fallbackMessage
}

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallbackMessage?: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    handleError(error, fallbackMessage)
    return null
  }
}

export function withErrorBoundary<T extends any[]>(
  fn: (...args: T) => Promise<any>,
  fallbackMessage?: string
) {
  return async (...args: T) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, fallbackMessage)
      return null
    }
  }
}

export const validateRequired = (value: any, fieldName: string) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required`)
  }
}

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address')
  }
}

export const validatePhone = (phone: string) => {
  const phoneRegex = /^(\+94|0)?[0-9]{9}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw new Error('Please enter a valid Sri Lankan phone number')
  }
}

export const validatePrice = (price: number | string) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice) || numPrice <= 0) {
    throw new Error('Price must be a valid positive number')
  }
  if (numPrice > 100000000) {
    throw new Error('Price cannot exceed 100 million')
  }
}
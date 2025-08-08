import { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  type: 'network' | 'database' | 'validation' | 'api' | 'unknown'
  message: string
  details?: string
  code?: string
  retryable?: boolean
}

export const createAppError = (
  type: AppError['type'],
  message: string,
  details?: string,
  code?: string,
  retryable: boolean = false
): AppError => ({
  type,
  message,
  details,
  code,
  retryable
})

export const handleSupabaseError = (error: PostgrestError): AppError => {
  // Map common Supabase error codes to user-friendly messages
  const errorMappings: Record<string, { message: string; retryable: boolean }> = {
    'PGRST116': { message: 'No data found matching your criteria', retryable: false },
    'PGRST301': { message: 'Database connection failed', retryable: true },
    'PGRST302': { message: 'Service temporarily unavailable', retryable: true },
    '23505': { message: 'Duplicate entry found', retryable: false },
    '23503': { message: 'Related record not found', retryable: false },
    '42P01': { message: 'Database table not found', retryable: false },
  }

  const mapping = errorMappings[error.code] || {
    message: 'Database operation failed',
    retryable: true
  }

  return createAppError(
    'database',
    mapping.message,
    error.details || error.hint,
    error.code,
    mapping.retryable
  )
}

export const handleNetworkError = (error: Error): AppError => {
  if (error.message.includes('fetch')) {
    return createAppError(
      'network',
      'Unable to connect to server. Please check your internet connection.',
      error.message,
      'NETWORK_ERROR',
      true
    )
  }

  if (error.message.includes('timeout')) {
    return createAppError(
      'network',
      'Request timed out. The server is taking too long to respond.',
      error.message,
      'TIMEOUT_ERROR',
      true
    )
  }

  return createAppError(
    'network',
    'Network error occurred',
    error.message,
    'UNKNOWN_NETWORK_ERROR',
    true
  )
}

export const handleAPIError = async (response: Response): Promise<AppError> => {
  let details = 'No additional details available'
  
  try {
    const errorData = await response.json()
    details = errorData.error || errorData.message || details
  } catch {
    details = `HTTP ${response.status}: ${response.statusText}`
  }

  const retryable = response.status >= 500 || response.status === 429

  return createAppError(
    'api',
    getAPIErrorMessage(response.status),
    details,
    response.status.toString(),
    retryable
  )
}

const getAPIErrorMessage = (status: number): string => {
  switch (status) {
    case 400: return 'Invalid request. Please check your input.'
    case 401: return 'Authentication required. Please sign in.'
    case 403: return 'Access denied. You don\'t have permission.'
    case 404: return 'Resource not found.'
    case 429: return 'Too many requests. Please try again later.'
    case 500: return 'Server error. Please try again.'
    case 503: return 'Service unavailable. Please try again later.'
    default: return 'An error occurred while processing your request.'
  }
}

export const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol) &&
           /\.(jpg|jpeg|png|gif|webp)$/i.test(urlObj.pathname)
  } catch {
    return false
  }
}

export const safeArrayAccess = <T>(array: T[], index: number, fallback: T): T => {
  return array && Array.isArray(array) && index >= 0 && index < array.length
    ? array[index]
    : fallback
}

export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      if (i === maxRetries) break
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }

  throw lastError!
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(null, args), wait)
  }
}

export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export const logError = (error: AppError, context?: string, extra?: Record<string, any>) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    ...error,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    ...extra
  }

  console.error('Application Error:', errorLog)

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Import dynamically to avoid SSR issues
    import('./sentry').then(({ reportError }) => {
      reportError(error, {
        action: context,
        extra: errorLog
      })
    }).catch(console.error)
  }
}
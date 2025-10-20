import { NextRequest, NextResponse } from 'next/server'
import { APIError } from '../errorHandling'

export interface APIErrorResponse {
  error: string
  message?: string
  details?: any
  timestamp: string
  path: string
  statusCode: number
  requestId?: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export class ValidationErrorCollection extends Error {
  public errors: ValidationError[]
  public statusCode: number = 400

  constructor(errors: ValidationError[], message = 'Validation failed') {
    super(message)
    this.name = 'ValidationErrorCollection'
    this.errors = errors
  }
}

/**
 * Standard API error response format
 */
export function createErrorResponse(
  error: Error | string,
  request: NextRequest,
  statusCode: number = 500,
  details?: any
): NextResponse {
  const path = request.nextUrl.pathname
  const timestamp = new Date().toISOString()
  const requestId = request.headers.get('x-request-id') || 
                   request.headers.get('x-vercel-id') || 
                   Math.random().toString(36).substring(7)

  let message: string
  let errorType: string
  let finalStatusCode = statusCode

  if (error instanceof APIError) {
    message = error.message
    errorType = error.name
    finalStatusCode = error.status
    details = error.details
  } else if (error instanceof ValidationErrorCollection) {
    message = error.message
    errorType = error.name
    finalStatusCode = error.statusCode
    details = { validationErrors: error.errors }
  } else if (error instanceof Error) {
    message = error.message
    errorType = error.name
  } else {
    message = typeof error === 'string' ? error : 'An unexpected error occurred'
    errorType = 'UnknownError'
  }

  const errorResponse: APIErrorResponse = {
    error: errorType,
    message,
    details,
    timestamp,
    path,
    statusCode: finalStatusCode,
    requestId,
  }

  // Log error in development (not in production for security)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[API Error] ${finalStatusCode} ${path}:`, {
      error: errorType,
      message,
      details,
      requestId,
    })
  }

  return NextResponse.json(errorResponse, { 
    status: finalStatusCode,
    headers: {
      'X-Request-ID': requestId,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    }
  })
}

/**
 * Handle different types of errors consistently
 */
export function handleAPIError(
  error: unknown,
  request: NextRequest,
  context?: string
): NextResponse {
  // Handle known error types
  if (error instanceof APIError) {
    return createErrorResponse(error, request, error.status, error.details)
  }

  if (error instanceof ValidationErrorCollection) {
    return createErrorResponse(error, request, 400, { validationErrors: error.errors })
  }

  // Handle Supabase/PostgreSQL errors
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as any
    
    // Handle specific PostgreSQL error codes
    switch (pgError.code) {
      case '23505': // Unique violation
        return createErrorResponse(
          'A record with this information already exists',
          request,
          409,
          { field: pgError.constraint }
        )
      case '23503': // Foreign key violation
        return createErrorResponse(
          'Referenced record does not exist',
          request,
          400,
          { constraint: pgError.constraint }
        )
      case '23514': // Check constraint violation
        return createErrorResponse(
          'Data validation failed',
          request,
          400,
          { constraint: pgError.constraint }
        )
      case 'PGRST116': // No rows returned
        return createErrorResponse(
          'Resource not found',
          request,
          404
        )
      default:
        // Generic database error
        if (process.env.NODE_ENV !== 'production') {
          return createErrorResponse(
            pgError.message || 'Database error',
            request,
            500,
            { code: pgError.code }
          )
        } else {
          return createErrorResponse(
            'Internal server error',
            request,
            500
          )
        }
    }
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    return createErrorResponse(error, request, 500)
  }

  // Handle unknown errors
  return createErrorResponse(
    'An unexpected error occurred',
    request,
    500,
    process.env.NODE_ENV !== 'production' ? { originalError: error } : undefined
  )
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse | Response>,
  context?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      const result = await handler(...args)
      return result as NextResponse
    } catch (error) {
      // Assuming the first argument is always NextRequest
      const request = args[0] as NextRequest
      return handleAPIError(error, request, context)
    }
  }
}

/**
 * Validate request data and throw ValidationErrorCollection if invalid
 */
export function validateRequestData(
  data: any,
  validators: { [field: string]: (value: any) => string | null }
): void {
  const errors: ValidationError[] = []

  for (const [field, validator] of Object.entries(validators)) {
    const value = data[field]
    const error = validator(value)
    
    if (error) {
      errors.push({ field, message: error, value })
    }
  }

  if (errors.length > 0) {
    throw new ValidationErrorCollection(errors)
  }
}

/**
 * Common validation functions
 */
export const validators = {
  required: (fieldName: string) => (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`
    }
    return null
  },

  email: (value: any): string | null => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Invalid email format'
  },

  minLength: (min: number) => (value: any): string | null => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters long`
  },

  maxLength: (max: number) => (value: any): string | null => {
    if (!value) return null
    return value.length <= max ? null : `Must be no more than ${max} characters long`
  },

  numeric: (value: any): string | null => {
    if (!value) return null
    return !isNaN(Number(value)) ? null : 'Must be a valid number'
  },

  positive: (value: any): string | null => {
    if (!value) return null
    return Number(value) > 0 ? null : 'Must be a positive number'
  },

  phoneNumber: (value: any): string | null => {
    if (!value) return null
    const phoneRegex = /^(\+94|0)?[0-9]{9}$/
    return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Invalid phone number format'
  },

  url: (value: any): string | null => {
    if (!value) return null
    try {
      new URL(value)
      return null
    } catch {
      return 'Invalid URL format'
    }
  },
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  }, { 
    status: statusCode,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
}
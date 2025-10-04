/**
 * Messaging Error Handling
 * Centralized error handling for messaging operations
 */

export class MessagingError extends Error {
  code: string
  statusCode: number
  details?: any

  constructor(
    message: string,
    code: string = 'MESSAGING_ERROR',
    statusCode: number = 500,
    details?: any
  ) {
    super(message)
    this.name = 'MessagingError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export const ErrorCodes = {
  // Authentication errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Validation errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',

  // Resource errors
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  LISTING_NOT_FOUND: 'LISTING_NOT_FOUND',
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',

  // Business logic errors
  SELF_MESSAGE_FORBIDDEN: 'SELF_MESSAGE_FORBIDDEN',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Create standardized error responses
 */
export function createErrorResponse(
  error: MessagingError | Error,
  defaultMessage: string = 'An error occurred'
): {
  error: string
  code?: string
  details?: any
} {
  if (error instanceof MessagingError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details
    }
  }

  // Handle generic errors
  return {
    error: error.message || defaultMessage,
    code: ErrorCodes.INTERNAL_ERROR
  }
}

/**
 * Validation utilities
 */
export const Validators = {
  messageContent: (content: string): void => {
    if (!content || content.trim().length === 0) {
      throw new MessagingError(
        'Message content is required',
        ErrorCodes.MISSING_REQUIRED_FIELD,
        400
      )
    }

    if (content.length > 2000) {
      throw new MessagingError(
        'Message content too long (max 2000 characters)',
        ErrorCodes.CONTENT_TOO_LONG,
        400
      )
    }
  },

  conversationAccess: (hasAccess: boolean): void => {
    if (!hasAccess) {
      throw new MessagingError(
        'Conversation not found or access denied',
        ErrorCodes.CONVERSATION_NOT_FOUND,
        404
      )
    }
  },

  selfMessage: (senderId: string, recipientId: string): void => {
    if (senderId === recipientId) {
      throw new MessagingError(
        'Cannot message yourself',
        ErrorCodes.SELF_MESSAGE_FORBIDDEN,
        400
      )
    }
  },

  requiredFields: (fields: Record<string, any>): void => {
    const missing = Object.entries(fields)
      .filter(([_, value]) => value === undefined || value === null || value === '')
      .map(([key, _]) => key)

    if (missing.length > 0) {
      throw new MessagingError(
        `Missing required fields: ${missing.join(', ')}`,
        ErrorCodes.MISSING_REQUIRED_FIELD,
        400
      )
    }
  }
}

/**
 * Performance monitoring for error tracking
 */
export async function logError(
  error: Error,
  context: {
    operation: string
    userId?: string
    conversationId?: string
    requestId?: string
  }
): Promise<void> {
  try {
    console.error('Messaging Error:', {
      message: error.message,
      stack: error.stack,
      ...context,
      timestamp: new Date().toISOString()
    })

    // In production, you might want to send to external error tracking
    // await sendToErrorTracking(error, context)
  } catch (loggingError) {
    console.error('Error logging failed:', loggingError)
  }
}
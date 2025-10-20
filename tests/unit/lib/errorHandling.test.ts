import {
  APIError,
  handleAPIResponse,
  handleError,
  withErrorHandling,
  withErrorBoundary,
  validateRequired,
  validateEmail,
  validatePhone,
  validatePrice,
} from '../../../lib/errorHandling'
import { toast } from 'sonner'

// Mock toast
jest.mock('sonner')
const mockToast = toast as jest.Mocked<typeof toast>

describe('APIError', () => {
  it('should create an APIError with correct properties', () => {
    const error = new APIError('Test error', 400, { field: 'email' })
    
    expect(error.name).toBe('APIError')
    expect(error.message).toBe('Test error')
    expect(error.status).toBe(400)
    expect(error.details).toEqual({ field: 'email' })
  })

  it('should default to status 500 if not provided', () => {
    const error = new APIError('Test error')
    
    expect(error.status).toBe(500)
  })
})

describe('handleAPIResponse', () => {
  it('should return parsed JSON for successful response', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 'test' }),
    } as unknown as Response

    const result = await handleAPIResponse(mockResponse)
    
    expect(result).toEqual({ data: 'test' })
    expect(mockResponse.json).toHaveBeenCalled()
  })

  it('should throw APIError for failed response with JSON error', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ 
        error: 'Validation failed',
        message: 'Email is required',
        details: { field: 'email' }
      }),
    } as unknown as Response

    await expect(handleAPIResponse(mockResponse)).rejects.toThrow(APIError)
    
    try {
      await handleAPIResponse(mockResponse)
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect((error as APIError).message).toBe('Email is required')
      expect((error as APIError).status).toBe(400)
      expect((error as APIError).details).toEqual({ field: 'email' })
    }
  })

  it('should throw APIError with network error for failed JSON parsing', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as Response

    await expect(handleAPIResponse(mockResponse)).rejects.toThrow(APIError)
    
    try {
      await handleAPIResponse(mockResponse)
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      expect((error as APIError).message).toBe('Internal Server Error')
      expect((error as APIError).status).toBe(500)
    }
  })
})

describe('handleError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should handle APIError correctly', () => {
    const error = new APIError('API error message', 400)
    
    const result = handleError(error)
    
    expect(mockToast.error).toHaveBeenCalledWith('API error message')
    expect(result).toBe('API error message')
    expect(console.error).toHaveBeenCalledWith('Error:', error)
  })

  it('should handle generic Error correctly', () => {
    const error = new Error('Generic error')
    
    const result = handleError(error)
    
    expect(mockToast.error).toHaveBeenCalledWith('Generic error')
    expect(result).toBe('Generic error')
    expect(console.error).toHaveBeenCalledWith('Error:', error)
  })

  it('should handle unknown error with fallback message', () => {
    const error = 'string error'
    
    const result = handleError(error, 'Custom fallback')
    
    expect(mockToast.error).toHaveBeenCalledWith('Custom fallback')
    expect(result).toBe('Custom fallback')
    expect(console.error).toHaveBeenCalledWith('Error:', error)
  })

  it('should use default fallback message', () => {
    const error = null
    
    const result = handleError(error)
    
    expect(mockToast.error).toHaveBeenCalledWith('An unexpected error occurred')
    expect(result).toBe('An unexpected error occurred')
  })
})

describe('withErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return result when operation succeeds', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    
    const result = await withErrorHandling(operation)
    
    expect(result).toBe('success')
    expect(operation).toHaveBeenCalled()
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('should return null and handle error when operation fails', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
    
    const result = await withErrorHandling(operation, 'Custom message')
    
    expect(result).toBeNull()
    expect(operation).toHaveBeenCalled()
    expect(mockToast.error).toHaveBeenCalledWith('Operation failed')
  })
})

describe('withErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return wrapped function that handles success', async () => {
    const originalFn = jest.fn().mockResolvedValue('success')
    const wrappedFn = withErrorBoundary(originalFn)
    
    const result = await wrappedFn('arg1', 'arg2')
    
    expect(result).toBe('success')
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2')
    expect(mockToast.error).not.toHaveBeenCalled()
  })

  it('should return null and handle error when wrapped function fails', async () => {
    const originalFn = jest.fn().mockRejectedValue(new Error('Function failed'))
    const wrappedFn = withErrorBoundary(originalFn, 'Custom boundary message')
    
    const result = await wrappedFn('arg1')
    
    expect(result).toBeNull()
    expect(originalFn).toHaveBeenCalledWith('arg1')
    expect(mockToast.error).toHaveBeenCalledWith('Function failed')
  })
})

describe('validateRequired', () => {
  it('should not throw for valid non-empty values', () => {
    expect(() => validateRequired('test', 'field')).not.toThrow()
    expect(() => validateRequired(123, 'number')).not.toThrow()
    expect(() => validateRequired(true, 'boolean')).not.toThrow()
    expect(() => validateRequired(['item'], 'array')).not.toThrow()
  })

  it('should throw for empty or invalid values', () => {
    expect(() => validateRequired('', 'field')).toThrow('field is required')
    expect(() => validateRequired('   ', 'field')).toThrow('field is required')
    expect(() => validateRequired(null, 'field')).toThrow('field is required')
    expect(() => validateRequired(undefined, 'field')).toThrow('field is required')
  })
})

describe('validateEmail', () => {
  it('should return true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    expect(validateEmail('user123@subdomain.domain.com')).toBe(true)
  })

  it('should return false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false)
    expect(validateEmail('invalid@')).toBe(false)
    expect(validateEmail('@domain.com')).toBe(false)
    expect(validateEmail('invalid.email')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('should not throw for valid Sri Lankan phone numbers', () => {
    expect(() => validatePhone('+94771234567')).not.toThrow()
    expect(() => validatePhone('0771234567')).not.toThrow()
    expect(() => validatePhone('771234567')).not.toThrow()
    expect(() => validatePhone('+94 77 123 4567')).not.toThrow()
  })

  it('should throw for invalid phone numbers', () => {
    expect(() => validatePhone('123')).toThrow('Please enter a valid Sri Lankan phone number')
    expect(() => validatePhone('invalid')).toThrow('Please enter a valid Sri Lankan phone number')
    expect(() => validatePhone('+1234567890')).toThrow('Please enter a valid Sri Lankan phone number')
    expect(() => validatePhone('')).toThrow('Please enter a valid Sri Lankan phone number')
  })
})

describe('validatePrice', () => {
  it('should not throw for valid prices', () => {
    expect(() => validatePrice(100)).not.toThrow()
    expect(() => validatePrice(0.01)).not.toThrow()
    expect(() => validatePrice('1000.50')).not.toThrow()
    expect(() => validatePrice(99999999)).not.toThrow()
  })

  it('should throw for invalid prices', () => {
    expect(() => validatePrice(0)).toThrow('Price must be a valid positive number')
    expect(() => validatePrice(-100)).toThrow('Price must be a valid positive number')
    expect(() => validatePrice('invalid')).toThrow('Price must be a valid positive number')
    expect(() => validatePrice(100000001)).toThrow('Price cannot exceed 100 million')
  })
})
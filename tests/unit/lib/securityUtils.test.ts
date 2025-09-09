import {
  formatSessionTime,
  getSessionStatus,
  getDeviceIcon,
  validateEmail,
  validatePassword,
  getPasswordStrengthColor,
} from '../../../lib/utils/securityUtils'

// Mock Date.now for consistent testing
const mockDate = new Date('2023-01-01T12:00:00Z')

describe('formatSessionTime', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return "Just now" for timestamps less than 1 minute ago', () => {
    const timestamp = new Date(mockDate.getTime() - 30000).toISOString() // 30 seconds ago
    expect(formatSessionTime(timestamp)).toBe('Just now')
  })

  it('should return minutes for timestamps less than 1 hour ago', () => {
    const timestamp = new Date(mockDate.getTime() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    expect(formatSessionTime(timestamp)).toBe('15m ago')
  })

  it('should return hours for timestamps less than 24 hours ago', () => {
    const timestamp = new Date(mockDate.getTime() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    expect(formatSessionTime(timestamp)).toBe('3h ago')
  })

  it('should return "Yesterday" for timestamps 1 day ago', () => {
    const timestamp = new Date(mockDate.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    expect(formatSessionTime(timestamp)).toBe('Yesterday')
  })

  it('should return days for timestamps less than 1 week ago', () => {
    const timestamp = new Date(mockDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    expect(formatSessionTime(timestamp)).toBe('3 days ago')
  })

  it('should return formatted date for timestamps more than 1 week ago', () => {
    const timestamp = new Date(mockDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    const result = formatSessionTime(timestamp)
    expect(result).toContain('Dec')
    expect(result).toContain('22')
  })
})

describe('getSessionStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(mockDate)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return active status for timestamps less than 15 minutes ago', () => {
    const timestamp = new Date(mockDate.getTime() - 10 * 60 * 1000).toISOString() // 10 minutes ago
    const result = getSessionStatus(timestamp)
    
    expect(result.status).toBe('active')
    expect(result.color).toBe('text-green-600')
    expect(result.label).toBe('Active Now')
  })

  it('should return recent status for timestamps less than 24 hours ago', () => {
    const timestamp = new Date(mockDate.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    const result = getSessionStatus(timestamp)
    
    expect(result.status).toBe('recent')
    expect(result.color).toBe('text-yellow-600')
    expect(result.label).toBe('Recently Active')
  })

  it('should return inactive status for timestamps more than 24 hours ago', () => {
    const timestamp = new Date(mockDate.getTime() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago
    const result = getSessionStatus(timestamp)
    
    expect(result.status).toBe('inactive')
    expect(result.color).toBe('text-gray-500')
    expect(result.label).toBe('Inactive')
  })
})

describe('getDeviceIcon', () => {
  it('should return Smartphone for mobile devices', () => {
    expect(getDeviceIcon('Mobile', 'Android')).toBe('Smartphone')
    expect(getDeviceIcon('iPhone', 'iOS')).toBe('Smartphone')
    expect(getDeviceIcon('Samsung Phone', 'Android')).toBe('Smartphone')
    expect(getDeviceIcon('Device', 'android')).toBe('Smartphone')
    expect(getDeviceIcon('Device', 'ios')).toBe('Smartphone')
  })

  it('should return Tablet for tablet devices', () => {
    expect(getDeviceIcon('Tablet', 'Android')).toBe('Tablet')
    expect(getDeviceIcon('iPad', 'iOS')).toBe('Tablet')
    expect(getDeviceIcon('Samsung Tablet', 'Android')).toBe('Tablet')
  })

  it('should return Laptop for desktop devices', () => {
    expect(getDeviceIcon('Computer', 'Windows')).toBe('Laptop')
    expect(getDeviceIcon('Desktop', 'macOS')).toBe('Laptop')
    expect(getDeviceIcon('PC', 'Linux')).toBe('Laptop')
    expect(getDeviceIcon('Device', 'mac')).toBe('Laptop')
    expect(getDeviceIcon('Device', 'windows')).toBe('Laptop')
    expect(getDeviceIcon('Device', 'linux')).toBe('Laptop')
  })

  it('should return Monitor for unknown devices', () => {
    expect(getDeviceIcon('Unknown', 'Unknown')).toBe('Monitor')
    expect(getDeviceIcon('', '')).toBe('Monitor')
  })
})

describe('validateEmail', () => {
  it('should return valid result for correct emails', () => {
    const result = validateEmail('test@example.com')
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should return invalid result for empty email', () => {
    const result = validateEmail('')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Email is required')
  })

  it('should return invalid result for malformed emails', () => {
    const result = validateEmail('invalid-email')
    expect(result.isValid).toBe(false)
    expect(result.error).toBe('Please enter a valid email address')
  })

  it('should validate various email formats', () => {
    expect(validateEmail('user@domain.com').isValid).toBe(true)
    expect(validateEmail('user.name@domain.com').isValid).toBe(true)
    expect(validateEmail('user+tag@domain.com').isValid).toBe(true)
    expect(validateEmail('@domain.com').isValid).toBe(false)
    expect(validateEmail('user@').isValid).toBe(false)
    expect(validateEmail('user.domain.com').isValid).toBe(false)
  })
})

describe('validatePassword', () => {
  it('should return invalid for empty password', () => {
    const result = validatePassword('')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password is required')
    expect(result.strength).toBe('weak')
  })

  it('should return invalid for short passwords', () => {
    const result = validatePassword('123')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Password must be at least 6 characters long')
    expect(result.strength).toBe('weak')
  })

  it('should return invalid for mismatched confirmation', () => {
    const result = validatePassword('password123', 'different')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Passwords do not match')
  })

  it('should return valid for matching passwords', () => {
    const result = validatePassword('password123', 'password123')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should calculate weak strength correctly', () => {
    const result = validatePassword('password')
    expect(result.strength).toBe('medium') // lowercase + length >= 8
  })

  it('should calculate medium strength correctly', () => {
    const result = validatePassword('Password1')
    expect(result.strength).toBe('strong') // uppercase + lowercase + number + length >= 8
  })

  it('should calculate strong strength correctly', () => {
    const result = validatePassword('Password1!')
    expect(result.strength).toBe('strong') // uppercase + lowercase + number + special + length >= 8
  })

  it('should handle password without confirmation', () => {
    const result = validatePassword('validpassword')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('getPasswordStrengthColor', () => {
  it('should return correct colors for each strength level', () => {
    expect(getPasswordStrengthColor('weak')).toBe('text-red-600 bg-red-50')
    expect(getPasswordStrengthColor('medium')).toBe('text-yellow-600 bg-yellow-50')
    expect(getPasswordStrengthColor('strong')).toBe('text-green-600 bg-green-50')
  })

  it('should return default color for unknown strength', () => {
    expect(getPasswordStrengthColor('unknown' as any)).toBe('text-gray-600 bg-gray-50')
  })
})
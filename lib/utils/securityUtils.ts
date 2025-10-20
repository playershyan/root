export interface SecuritySession {
  id: string
  device_name: string
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  location_city: string
  location_country: string
  ip_address: string
  last_activity: string
  created_at: string
  is_current_session: boolean
}

export interface EmailUpdateData {
  currentEmail: string
  newEmail: string
  confirmEmail: string
  isVerified: boolean
}

export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface TwoFactorAuthData {
  isEnabled: boolean
  phoneNumber?: string
  method: 'sms' | 'app' | 'email'
}

export function formatSessionTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }
}

export function getSessionStatus(lastActivity: string): {
  status: 'active' | 'recent' | 'inactive'
  color: string
  label: string
} {
  const diff = new Date().getTime() - new Date(lastActivity).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (minutes < 15) {
    return {
      status: 'active',
      color: 'text-green-600',
      label: 'Active Now'
    }
  } else if (hours < 24) {
    return {
      status: 'recent',
      color: 'text-yellow-600',
      label: 'Recently Active'
    }
  } else {
    return {
      status: 'inactive',
      color: 'text-gray-500',
      label: 'Inactive'
    }
  }
}

export function getDeviceIcon(deviceName: string, osName: string): string {
  const device = deviceName.toLowerCase()
  const os = osName.toLowerCase()
  
  // Check for tablets first (more specific)
  if (device.includes('tablet') || device.includes('ipad')) {
    return 'Tablet'
  } else if (device.includes('mobile') || device.includes('phone') || 
             (os.includes('android') && !device.includes('tablet')) || 
             (os.includes('ios') && !device.includes('ipad'))) {
    return 'Smartphone'
  } else if (os.includes('mac') || os.includes('windows') || os.includes('linux')) {
    return 'Laptop'
  } else {
    return 'Monitor'
  }
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
}

export function validatePassword(password: string, confirmPassword?: string): { 
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const errors: string[] = []
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'], strength: 'weak' }
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push('Passwords do not match')
  }
  
  // Strength calculation
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  let score = 0
  
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  
  if (score >= 4) strength = 'strong'
  else if (score >= 2) strength = 'medium'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-600 bg-red-50'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50'
    case 'strong':
      return 'text-green-600 bg-green-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}
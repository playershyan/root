/**
 * Authentication Components
 * Export all authentication-related components and types
 */

// Main Modal
export { default as AuthModal } from './AuthModal'

// Provider Components
export { default as GoogleSignInButton } from './GoogleSignInButton'
export { default as GoogleOneTapProvider } from './GoogleOneTapProvider'

// Form Components
export { default as EmailAuthForm } from './EmailAuthForm'
export { default as PhoneAuthForm } from './PhoneAuthForm'
export { default as OTPVerification } from './OTPVerification'

// Streamlined Registration
export { default as StreamlinedSignup } from './StreamlinedSignup'
export { default as PhoneNumberInput } from './PhoneNumberInput'
export { default as OTPInput } from './OTPInput'
export { default as UsernameCreation } from './UsernameCreation'

// Types
export type {
  AuthResult,
  AuthButtonProps,
  AuthModalProps,
  PhoneAuthProps,
  EmailAuthProps,
  OTPVerificationProps
} from './types'

// Configuration
export { authConfig, validateAuthConfig } from '@/lib/config/auth.config'
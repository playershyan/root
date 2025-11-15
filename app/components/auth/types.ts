/**
 * Authentication Component Types
 */

export interface AuthResult {
  success: boolean;
  error?: {
    message: string;
    code?: string;
  };
  user?: any;
  requiresEmailVerification?: boolean;
  requiresPhoneVerification?: boolean;
  email?: string; // Email address for verification
}

export interface AuthButtonProps {
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: string) => void;
  variant?: 'default' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
}

export interface PhoneAuthProps extends AuthButtonProps {
  countryCode?: string;
  onCountryChange?: (countryCode: string) => void;
}

export interface EmailAuthProps extends AuthButtonProps {
  type: 'login' | 'register';
}

export interface OTPVerificationProps {
  phone?: string;
  email?: string;
  name?: string;
  onVerificationComplete: (result: AuthResult) => void;
  onResendOTP: () => void;
  resendTimer?: number;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register';
  allowedMethods?: Array<'google' | 'email' | 'phone'>;
  onAuthSuccess?: () => void;
}
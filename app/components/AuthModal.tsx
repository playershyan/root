'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { signInWithOTP, verifyOTP, signUp } from '@/lib/auth'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialAuthType?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, initialAuthType = 'login' }: AuthModalProps) {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [authType, setAuthType] = useState<'login' | 'register'>(initialAuthType)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showOtp, setShowOtp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isOpen])

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Auto-detect and fill OTP from SMS (Web OTP API)
  useEffect(() => {
    if (showOtp && isOpen && 'OTPCredential' in window) {
      abortControllerRef.current = new AbortController()
      
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortControllerRef.current.signal
      } as any).then((credential: any) => {
        if (credential && credential.code) {
          const otpArray = credential.code.split('').slice(0, 6)
          setOtp(otpArray)
          setSuccess('OTP detected automatically!')
          // Auto-submit OTP
          handleVerifyOtp(otpArray.join(''))
        }
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          console.log('OTP retrieval error:', err)
        }
      })

      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    }
  }, [showOtp, isOpen])

  const resetForm = () => {
    setMode('phone')
    setAuthType(initialAuthType)
    setName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setOtp(['', '', '', '', '', ''])
    setShowOtp(false)
    setError('')
    setSuccess('')
    setResendTimer(0)
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.startsWith('94')) {
      return '+' + numbers.slice(0, 11)
    } else if (numbers.startsWith('0')) {
      return '+94' + numbers.slice(1, 10)
    } else {
      return '+94' + numbers.slice(0, 9)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'phone') {
      // Phone OTP flow
      if (authType === 'register' && !name.trim()) {
        setError('Please enter your username')
        setLoading(false)
        return
      }

      if (phone.length < 9) {
        setError('Please enter a valid mobile number')
        setLoading(false)
        return
      }

      const formattedPhone = formatPhoneNumber(phone)
      const result = await signInWithOTP(formattedPhone)

      if (result.success) {
        setShowOtp(true)
        setResendTimer(60)
        setSuccess('OTP sent successfully!')
      } else {
        setError(result.error?.message || 'Failed to send OTP')
      }
    } else {
      // Email/password flow
      if (authType === 'register') {
        // Registration validation
        if (!name.trim()) {
          setError('Please enter your username')
          setLoading(false)
          return
        }
        if (!email.trim()) {
          setError('Please enter your email')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }

        const result = await signUp(email, password, undefined, name)
        if (result.success) {
          setSuccess('Account created successfully!')
          await refreshUser()
          setTimeout(() => {
            onClose()
            router.push('/profile')
          }, 1500)
        } else {
          setError(result.error?.message || 'Failed to create account')
        }
      } else {
        // Login validation
        if (!email.trim()) {
          setError('Please enter your email')
          setLoading(false)
          return
        }
        if (!password.trim()) {
          setError('Please enter your password')
          setLoading(false)
          return
        }

        const { signInWithEmail } = await import('@/lib/auth')
        const result = await signInWithEmail(email, password)
        if (result.success) {
          setSuccess('Login successful!')
          await refreshUser()
          setTimeout(() => {
            onClose()
            router.push('/profile')
          }, 1500)
        } else {
          setError(result.error?.message || 'Invalid email or password')
        }
      }
    }

    setLoading(false)
  }

  const handleVerifyOtp = async (otpCode?: string) => {
    setLoading(true)
    setError('')
    
    const code = otpCode || otp.join('')
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }
    
    const formattedPhone = formatPhoneNumber(phone)
    const result = await verifyOTP(formattedPhone, code)
    
    if (result.success) {
      // If registering, update profile with name
      if (authType === 'register' && result.user) {
        const { supabase } = await import('@/lib/supabase')
        await supabase.from('profiles').update({
          name: name
        }).eq('id', result.user.id)
      }
      
      setSuccess(authType === 'register' ? 'Account created successfully!' : 'Login successful!')
      await refreshUser()
      
      setTimeout(() => {
        onClose()
        router.push('/profile')
      }, 1500)
    } else {
      setError(result.error?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
    }
    
    setLoading(false)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, 6).split('')
      const newOtp = [...otp]
      pastedOtp.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit
        }
      })
      setOtp(newOtp)
      const lastIndex = Math.min(index + pastedOtp.length - 1, 5)
      otpInputRefs.current[lastIndex]?.focus()
    } else {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)
      
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus()
      }
      
      // Auto-verify if all filled
      if (value && index === 5) {
        const fullOtp = [...newOtp]
        if (fullOtp.every(digit => digit)) {
          setTimeout(() => handleVerifyOtp(fullOtp.join('')), 500)
        }
      }
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOtp = async () => {
    setOtp(['', '', '', '', '', ''])
    await handleSubmit(new Event('submit') as any)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
      {/* Overlay - Hidden on mobile */}
      <div 
        className="hidden md:block absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Full screen on mobile, centered on desktop */}
      <div className="relative z-10 w-full h-full md:max-w-4xl md:h-auto md:mx-4 bg-white md:rounded-lg shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="flex flex-col md:flex-row h-full md:min-h-[520px] md:max-h-[90vh]">
          {/* Value Proposition Section - Hidden on mobile, shown at bottom */}
          <div className="hidden md:block md:flex-1 p-6 md:p-8 bg-white border-b md:border-b-0 md:border-r border-gray-200">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-600 mb-1">
                  {authType === 'login' ? 'Hi there! Welcome back!' : 'Join AutoTrader.lk today!'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {authType === 'login' ? 'Log in to manage your account' : 'Create your account and unlock these features'}
                </p>
              </div>
              
              <ul className="space-y-3">
                <li className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Post & manage your vehicle ads with ease.</span>
                </li>
                <li className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Create & track your wanted requests.</span>
                </li>
                <li className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Save your favorite ads & view them anytime.</span>
                </li>
                <li className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Manage all your conversations in one place.</span>
                </li>
                <li className="flex items-start gap-3 pb-3 border-b border-gray-100">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Discover & manage AutoTrader® membership plans.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">Get detailed analytics on your listings.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Form Section - Full height on mobile */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 md:p-8 min-h-full flex flex-col justify-center">

            {/* Mobile Value Proposition - At top for sign-up only */}
            {authType === 'register' && !showOtp && (
              <div className="md:hidden bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-blue-800 text-sm mb-3 text-center">Join AutoTrader.lk & unlock:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span>Post & manage vehicle ads</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span>Track wanted requests</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span>Save favorites & manage messages</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-blue-700">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0"></div>
                    <span>Get analytics & premium features</span>
                  </li>
                </ul>
              </div>
            )}

            <h3 className="text-xl font-bold text-blue-600 text-center mb-6">
              {showOtp ? 'Verify Your Number' : (authType === 'login' ? 'Welcome Back!' : 'Create Account')}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm text-center">
                {success}
              </div>
            )}

            {!showOtp ? (
              <form onSubmit={handleSubmit}>
                {mode === 'email' && authType === 'register' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {mode === 'phone' && authType === 'register' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {mode === 'email' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {mode === 'email' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {mode === 'email' && authType === 'register' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                {mode === 'phone' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="+94"
                        className="w-20 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg text-center"
                        disabled
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="771234567"
                        className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        maxLength={9}
                      />
                    </div>
                  </div>
                )}

                {/* Terms agreement for sign-up */}
                {authType === 'register' && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                      By signing up for an account you agree to our{' '}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Terms & Conditions
                      </a>
                      {' | '}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Privacy Policy
                      </a>
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
                >
                  {loading ? (mode === 'email' ? (authType === 'register' ? 'Creating Account...' : 'Signing In...') : 'Sending OTP...') : (mode === 'email' ? (authType === 'register' ? 'Create Account' : 'Sign In') : (authType === 'register' ? 'Create Account' : 'Send OTP'))}
                </button>
              </form>
            ) : (
              <div>
                <p className="text-center text-gray-600 mb-4">
                  We've sent a code to +94 {phone}
                </p>

                {'OTPCredential' in window && (
                  <div className="mb-4 p-2 bg-green-50 border border-green-200 text-green-600 rounded text-xs text-center">
                    ✅ Auto-detection ready
                  </div>
                )}

                <div className="flex gap-2 justify-center mb-6">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.join('').length !== 6}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mb-4"
                >
                  {loading ? 'Verifying...' : (authType === 'register' ? 'Verify & Create Account' : 'Verify OTP')}
                </button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend OTP in {resendTimer} seconds
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}

            {!showOtp && mode === 'phone' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="font-medium text-gray-700">Continue with Google</span>
                  </button>
                  
                  <button className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877f2"/>
                    </svg>
                    <span className="font-medium text-gray-700">Continue with Facebook</span>
                  </button>
                  
                  <button 
                    onClick={() => setMode('email')}
                    className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium text-gray-700">Continue with Email</span>
                  </button>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    {authType === 'login' ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          onClick={() => setAuthType('register')}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Sign Up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          onClick={() => setAuthType('login')}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Login
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </>
            )}

            {!showOtp && mode === 'email' && (
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  {authType === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        onClick={() => setAuthType('register')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        onClick={() => setAuthType('login')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Login
                      </button>
                    </>
                  )}
                </p>
                <button
                  onClick={() => setMode('phone')}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2 block"
                >
                  ← {authType === 'register' ? 'Sign up with phone number' : 'Log in with phone number'}
                </button>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [showModal, setShowModal] = useState(true)

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/profile')
    }
  }, [user, loading, router])

  const handleClose = () => {
    setShowModal(false)
    router.push('/')
  }

  // Don't render if user is already logged in
  if (!loading && user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page content with breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm">
            <a href="/" className="text-gray-600 hover:text-blue-600">Home</a>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Create Account</span>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Join AutoTrader.lk Today</h1>
          <p className="text-gray-600 mb-8">Create your account to start buying and selling vehicles with Sri Lanka's leading automotive marketplace.</p>
          
          {/* Benefits section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">List Your Vehicles</h3>
              <p className="text-sm text-gray-600">Post unlimited vehicle ads with AI-powered descriptions and reach thousands of buyers.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Find Your Dream Car</h3>
              <p className="text-sm text-gray-600">Browse verified listings, save favorites, and post wanted requests to find exactly what you need.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect Safely</h3>
              <p className="text-sm text-gray-600">Message sellers directly, schedule viewings, and complete transactions with confidence.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal - Always show when page loads, defaulting to register */}
      <AuthModal 
        isOpen={showModal} 
        onClose={handleClose}
        initialAuthType="register"
      />
    </div>
  )
}
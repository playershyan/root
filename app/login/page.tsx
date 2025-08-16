'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthModal from '../components/AuthModal'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
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
            <span className="text-gray-900">Sign In</span>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back to AutoTrader.lk</h1>
          <p className="text-gray-600 mb-8">Sign in to manage your listings, save favorites, and connect with buyers and sellers.</p>
        </div>
      </div>

      {/* Auth Modal - Always show when page loads */}
      <AuthModal 
        isOpen={showModal} 
        onClose={handleClose}
      />
    </div>
  )
}
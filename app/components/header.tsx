'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Heart, User, Search, Menu, X, Bell, 
  Car, MessageSquare, Settings, LogOut,
  Crown, Shield, FileText, HelpCircle, Plus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  membershipType?: 'basic' | 'gold' | 'platinum'
  unreadMessages?: number
  favorites?: number
}

export default function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  
  // Get user from auth context
  const { user: authUser, signOut } = useAuth()
  const user = authUser ? {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    membershipType: 'basic' as const,
    unreadMessages: 0,
    favorites: 0
  } : null

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Left side - Mobile menu, Logo, and Mobile Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-xl sm:text-2xl font-bold text-blue-600">AutoTrader.lk</span>
            </Link>
            
            {/* Mobile Action Buttons */}
            <div className="flex items-center gap-2 ml-auto sm:hidden">
              <Link 
                href="/wanted" 
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-blue-50 text-xs"
              >
                <Search className="w-4 h-4" />
                <span>Wanted</span>
              </Link>
              
              <Link 
                href="/post" 
                className="bg-blue-600 text-white px-2 py-2 rounded-lg hover:bg-blue-700 font-medium text-xs flex items-center gap-1"
              >
                <Car className="w-4 h-4" />
                <span>Sell</span>
              </Link>
            </div>
          </div>
          
          {/* Center Navigation - Desktop Only */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link href="/listings" className="text-gray-700 hover:text-blue-600 font-medium">
              Browse Vehicles
            </Link>
            <Link href="/wanted" className="text-gray-700 hover:text-blue-600 font-medium">
              Wanted Requests
            </Link>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User Menu - Desktop Only */}
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    {user.membershipType === 'gold' && (
                      <Crown className="w-4 h-4 text-amber-600" />
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2">
                      <div className="px-4 py-3 border-b">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.membershipType === 'gold' && (
                          <div className="flex items-center gap-1 mt-1">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span className="text-sm text-amber-600 font-medium">Gold Member</span>
                          </div>
                        )}
                      </div>
                      
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      
                      <Link
                        href="/profile?tab=listings"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Car className="w-4 h-4" />
                        My Listings
                      </Link>
                      
                      <Link
                        href="/profile?tab=messages"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Messages
                        {user.unreadMessages && user.unreadMessages > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {user.unreadMessages}
                          </span>
                        )}
                      </Link>
                      
                      <Link
                        href="/profile?tab=favorites"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Heart className="w-4 h-4" />
                        Favorites
                      </Link>
                      
                      <Link
                        href="/profile?tab=wanted"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <FileText className="w-4 h-4" />
                        Wanted Requests
                      </Link>
                      
                      <hr className="my-2" />
                      
                      <Link
                        href="/profile?tab=membership"
                        className="block px-4 py-2 text-amber-700 hover:bg-amber-50 flex items-center gap-3"
                      >
                        <Crown className="w-4 h-4" />
                        Membership
                      </Link>
                      
                      <Link
                        href="/profile?tab=security"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Shield className="w-4 h-4" />
                        Security
                      </Link>
                      
                      <Link
                        href="/help"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Help & Support
                      </Link>
                      
                      <hr className="my-2" />
                      
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Profile Icon to open Auth Modal - Hidden on mobile */}
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden md:block p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Sign In / Sign Up"
                >
                  <User className="w-5 h-5" />
                </button>
              </>
            )}
            
            {/* Desktop Action Buttons */}
            <Link 
              href="/wanted/post" 
              className="hidden sm:flex text-blue-600 hover:text-blue-700 font-medium items-center gap-1"
            >
              <span>Post Wanted</span>
            </Link>
            
            <Link 
              href="/post" 
              className="hidden sm:flex btn-primary btn-icon"
            >
              <span>Sell Vehicle</span>
            </Link>
          </div>
        </div>
        
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />

      {/* Full Screen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-50 md:hidden overflow-y-auto">
          <div className="px-4 py-4">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="text-2xl font-bold text-blue-600" onClick={() => setMobileMenuOpen(false)}>
                AutoTrader.lk
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sign In/Sign Up Button - Top of menu for unauthenticated users */}
            {!user && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setAuthModalOpen(true)
                  }}
                  className="w-full py-4 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 shadow-lg"
                >
                  <User className="w-6 h-6" />
                  Sign In / Sign Up
                </button>
              </div>
            )}

            {/* User Profile Section */}
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-medium">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                {user.membershipType === 'gold' && (
                  <div className="flex items-center gap-1 bg-amber-50 rounded-md px-3 py-1.5 inline-flex">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">Gold Member</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="space-y-1">
              <Link 
                href="/" 
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/listings" 
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Vehicles
              </Link>
              <Link 
                href="/wanted" 
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Wanted Requests
              </Link>
              <Link 
                href="/post" 
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell My Vehicle
              </Link>
              <Link 
                href="/wanted/post" 
                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Post Wanted Request
              </Link>
              
              {user ? (
                <>
                  <div className="border-t my-4" />
                  
                  <Link 
                    href="/profile" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                  
                  <Link 
                    href="/profile?tab=listings" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Car className="w-5 h-5" />
                    My Listings
                  </Link>
                  
                  <Link 
                    href="/profile?tab=messages" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="flex-1">Messages</span>
                    {user.unreadMessages && user.unreadMessages > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {user.unreadMessages}
                      </span>
                    )}
                  </Link>
                  
                  <Link 
                    href="/profile?tab=favorites" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="flex-1">Favorites</span>
                    {user.favorites && user.favorites > 0 && (
                      <span className="bg-gray-100 text-gray-700 text-xs rounded-full px-2 py-0.5">
                        {user.favorites}
                      </span>
                    )}
                  </Link>
                  
                  <Link 
                    href="/profile?tab=wanted" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FileText className="w-5 h-5" />
                    Wanted Requests
                  </Link>
                  
                  <div className="border-t my-4" />
                  
                  <Link 
                    href="/profile?tab=membership" 
                    className="block py-3 px-4 text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Crown className="w-5 h-5" />
                    Membership
                  </Link>
                  
                  <Link 
                    href="/profile?tab=security" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="w-5 h-5" />
                    Security Settings
                  </Link>
                  
                  <Link 
                    href="/help" 
                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HelpCircle className="w-5 h-5" />
                    Help & Support
                  </Link>
                  
                  <div className="border-t my-4" />
                  
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="block w-full py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  )
}
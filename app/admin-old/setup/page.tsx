'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, User, Settings, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { logger } from '@/lib/utils/logger'

interface AdminStatus {
  current_user: {
    email: string
    user_id: string
    is_admin: boolean
    permissions: any
  }
  admin_summary: {
    total_admins: number
    can_bootstrap: boolean
  }
  all_admins: any[]
}

export default function AdminSetup() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/')
      return
    }

    checkAdminStatus()
  }, [user, authLoading])

  const checkAdminStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/setup')
      
      if (response.ok) {
        const data = await response.json()
        setAdminStatus(data)
      } else {
        setError('Failed to check admin status')
      }
    } catch (err) {
      logger.error('Error checking admin status', err as Error)
      setError('Failed to check admin status')
    } finally {
      setLoading(false)
    }
  }

  const bootstrapAdmin = async () => {
    if (!user?.email) return

    setBootstrapping(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'bootstrap',
          email: user.email 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Success! ${data.message}`)
        await checkAdminStatus()
        
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          router.push('/admin')
        }, 2000)
      } else {
        setError(data.error || 'Failed to bootstrap admin user')
      }
    } catch (err) {
      logger.error('Error bootstrapping admin', err as Error)
      setError('Failed to bootstrap admin user')
    } finally {
      setBootstrapping(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin setup...</p>
        </div>
      </div>
    )
  }

  if (!adminStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700">Failed to load admin status</p>
          <button
            onClick={checkAdminStatus}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Setup</h1>
          <p className="text-gray-600 mt-2">Configure administrative access for your application</p>
        </div>

        {/* Current User Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Current User Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email:</p>
              <p className="font-medium text-gray-900">{adminStatus.current_user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admin Status:</p>
              <div className="flex items-center gap-2">
                {adminStatus.current_user.is_admin ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Admin Access Granted</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700">No Admin Access</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {adminStatus.current_user.is_admin && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Permissions:</p>
              <div className="flex flex-wrap gap-2">
                {adminStatus.current_user.permissions?.permissions && 
                 Object.values(adminStatus.current_user.permissions.permissions).map((permission: any, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Admin Users:</p>
              <p className="text-2xl font-bold text-gray-900">{adminStatus.admin_summary.total_admins}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bootstrap Available:</p>
              <div className="flex items-center gap-2">
                {adminStatus.admin_summary.can_bootstrap ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700">Yes</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-700">No</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
          
          {!adminStatus.current_user.is_admin && adminStatus.admin_summary.can_bootstrap && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Bootstrap Admin Access</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    No admin users exist in the system. You can bootstrap admin access for your current account.
                  </p>
                  <button
                    onClick={bootstrapAdmin}
                    disabled={bootstrapping}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bootstrapping ? 'Bootstrapping...' : 'Grant Admin Access'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminStatus.current_user.is_admin && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900">Admin Access Active</h3>
                  <p className="text-green-700 text-sm mt-1">
                    You have admin access and can access the admin dashboard.
                  </p>
                  <button
                    onClick={() => router.push('/admin')}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Go to Admin Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {!adminStatus.admin_summary.can_bootstrap && !adminStatus.current_user.is_admin && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-orange-900">Admin Access Required</h3>
                  <p className="text-orange-700 text-sm mt-1">
                    Admin users already exist in the system. Contact an existing administrator to request access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Development Help */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Development Mode</h3>
                <p className="text-blue-700 text-sm mt-1">
                  For development, you can use a special email pattern to get temporary admin access:
                </p>
                <ul className="text-blue-700 text-sm mt-2 space-y-1">
                  <li>• Email ending with <code className="bg-blue-100 px-1 rounded">@admin.local</code></li>
                  <li>• Email ending with <code className="bg-blue-100 px-1 rounded">@dev.local</code></li>
                  <li>• Email starting with <code className="bg-blue-100 px-1 rounded">admin@</code></li>
                  <li>• Email: <code className="bg-blue-100 px-1 rounded">test@example.com</code></li>
                </ul>
                <p className="text-blue-700 text-xs mt-2">
                  ⚠️ This development fallback only works when no admin users exist in the database or when database functions are not available.
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Existing Admins */}
        {adminStatus.all_admins.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Admin Users</h2>
            <div className="space-y-3">
              {adminStatus.all_admins.map((admin, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{admin.email}</p>
                    <p className="text-sm text-gray-600">Role: {admin.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.is_active ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-700">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
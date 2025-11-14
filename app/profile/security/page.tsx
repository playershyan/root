import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, Shield, CheckCircle, XCircle, Key, Smartphone, Mail, Clock } from 'lucide-react'
import Link from 'next/link'
import { getSecurityInfo } from './utils/getSecurityInfo'
import { Button } from '@/components/ui/button'

// Enable ISR with 60-second revalidation
export const revalidate = 60

function formatDate(dateString?: string): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

export default async function SecurityPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { security, recentLogins } = await getSecurityInfo(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-semibold">Security Settings</h1>
            </div>
            <p className="text-gray-600">
              Manage your account security and login credentials
            </p>
          </div>

          {/* Account Security */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Account Security</h2>
            
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-sm text-gray-600">{security.email}</p>
                  </div>
                </div>
                {security.email_confirmed_at ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Not Verified</span>
                  </div>
                )}
              </div>

              {/* Phone */}
              {security.phone && (
                <div className="flex items-center justify-between py-3 border-b">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Phone Number</p>
                      <p className="text-sm text-gray-600">{security.phone}</p>
                    </div>
                  </div>
                  {security.phone_confirmed_at ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Not Verified</span>
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-gray-600">
                      {security.has_password ? '••••••••' : 'Not set'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Change Password
                </Button>
              </div>

              {/* 2FA */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">
                      {security.mfa_enabled ? 'Enabled' : 'Add extra security to your account'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {security.mfa_enabled ? 'Manage' : 'Enable'}
                </Button>
              </div>
            </div>
          </div>

          {/* Login Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Login Activity</h2>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">Last Sign In</span>
                <span className="font-medium">{formatDate(security.last_sign_in_at)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-600">Account Created</span>
                <span className="font-medium">{formatDate(security.created_at)}</span>
              </div>

              {recentLogins.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Recent Login History</p>
                  <div className="space-y-2">
                    {recentLogins.slice(0, 5).map((login) => (
                      <div key={login.id} className="text-sm text-gray-600 flex items-center justify-between">
                        <span>{formatDate(login.created_at)}</span>
                        {login.ip_address && (
                          <span className="text-xs text-gray-500">{login.ip_address}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" disabled>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

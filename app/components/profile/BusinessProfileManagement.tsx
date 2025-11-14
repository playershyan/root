'use client'

import { useState } from 'react'
import { Building2, Plus, Pause, Play, Trash2, AlertTriangle } from 'lucide-react'
import { BusinessProfile } from '@/lib/types/businessProfile'
import { Button } from '@/components/ui/button'

interface BusinessProfileManagementProps {
  businessProfile: BusinessProfile | null
  onCreateProfile: () => void
  onPauseProfile: () => void
  onResumeProfile: () => void
  onDeleteProfile: () => void
  loading?: boolean
}

export default function BusinessProfileManagement({
  businessProfile,
  onCreateProfile,
  onPauseProfile,
  onResumeProfile,
  onDeleteProfile,
  loading = false
}: BusinessProfileManagementProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDelete = () => {
    onDeleteProfile()
    setShowDeleteConfirm(false)
  }

  if (!businessProfile) {
    return (
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Profile</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Create a business profile to manage your dealership information.
            </p>
            <Button
              onClick={onCreateProfile}
              disabled={loading}
              variant="primary"
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Business Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg flex-shrink-0">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 w-full min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Profile</h3>
            <p className="text-gray-600 text-sm sm:text-base truncate">{businessProfile.business_name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs sm:text-sm px-2 py-1 rounded-full whitespace-nowrap ${
                businessProfile.is_verified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {businessProfile.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
              {!businessProfile.is_active && (
                <span className="text-xs sm:text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Actions</h4>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!businessProfile.is_active ? (
              <Button
                onClick={onResumeProfile}
                disabled={loading}
                variant="success"
                className="w-full sm:w-auto"
              >
                <Play className="w-4 h-4 mr-2" />
                Activate
              </Button>
            ) : (
              <Button
                onClick={onPauseProfile}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto"
              >
                <Pause className="w-4 h-4 mr-2" />
                Deactivate
              </Button>
            )}

            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              variant="danger"
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          {!businessProfile.is_active && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm min-w-0">
                  <p className="font-medium text-yellow-800">Profile Inactive</p>
                  <p className="text-yellow-700 mt-1">
                    Your business profile is paused and not visible to customers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Delete Business Profile?</h3>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  This action cannot be undone. All business information will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium mb-2">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                <li>Your business page</li>
                <li>All business information</li>
                <li>Verification status</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleDelete}
                disabled={loading}
                variant="danger"
                className="flex-1 order-2 sm:order-1"
              >
                Delete Profile
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 order-1 sm:order-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
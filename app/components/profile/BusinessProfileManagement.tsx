'use client'

import { useState } from 'react'
import { Building2, Plus, Pause, Play, Trash2, AlertTriangle } from 'lucide-react'
import { BusinessProfile } from '@/lib/types/businessProfile'

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
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Profile</h3>
            <p className="text-gray-600 mb-4">
              Create a business profile to showcase your dealership, build trust with customers, 
              and access advanced selling tools.
            </p>
            <button
              onClick={onCreateProfile}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Create Business Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Profile</h3>
            <p className="text-gray-600">{businessProfile.business_name}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                businessProfile.is_verified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {businessProfile.is_verified ? 'Verified' : 'Pending Verification'}
              </span>
              {businessProfile.is_paused && (
                <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Business Profile Actions</h4>
          <div className="flex flex-wrap gap-3">
            {businessProfile.is_paused ? (
              <button
                onClick={onResumeProfile}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Resume Business Profile
              </button>
            ) : (
              <button
                onClick={onPauseProfile}
                disabled={loading}
                className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pause className="w-4 h-4" />
                Pause Business Profile
              </button>
            )}
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Delete Business Profile
            </button>
          </div>

          {businessProfile.is_paused && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Profile Paused</p>
                  <p className="text-yellow-700 mt-1">
                    Your business profile is currently paused. Customers cannot view your business page or contact you through it.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Business Profile?</h3>
                <p className="text-gray-600 mt-1">
                  This action cannot be undone. All your business information, including the business page, will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> Deleting your business profile will:
              </p>
              <ul className="list-disc list-inside text-sm text-red-600 mt-2 space-y-1">
                <li>Remove your business page from the platform</li>
                <li>Delete all business information and settings</li>
                <li>Remove business verification status</li>
                <li>This cannot be reversed</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Yes, Delete Profile
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import DeleteAccountModal from '../modals/DeleteAccountModal'

interface DeleteAccountCardProps {
  userEmail?: string
  onDelete?: () => Promise<void>
  loading?: boolean
}

export default function DeleteAccountCard({
  userEmail,
  onDelete,
  loading = false
}: DeleteAccountCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [warnings, setWarnings] = useState<string[]>([])
  const [checkingStatus, setCheckingStatus] = useState(false)

  const checkDeletionStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/user/delete-account')
      if (response.ok) {
        const data = await response.json()
        setWarnings(data.warnings || [])
      }
    } catch (error) {
      console.error('Error checking deletion status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleOpenModal = async () => {
    await checkDeletionStatus()
    setShowModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      await onDelete()
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-1">This action is permanent and cannot be undone</p>
                <p>Deleting your account will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove all your personal information</li>
                  <li>Delete all your vehicle listings</li>
                  <li>Delete all your wanted requests</li>
                  <li>Remove your business profile (if applicable)</li>
                  <li>Delete all messages and conversations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleOpenModal}
            disabled={loading || checkingStatus}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {checkingStatus ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking account status...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </>
            )}
          </button>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Some data may be retained for legal and regulatory compliance 
              for up to 30 days after deletion. For more information, see our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDeleteConfirm}
        userEmail={userEmail}
        warnings={warnings}
      />
    </>
  )
}
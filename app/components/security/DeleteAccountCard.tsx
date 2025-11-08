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
      <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-inner sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 sm:h-12 sm:w-12">
            <Trash2 className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Delete Account</h3>
            <p className="text-sm text-gray-600">Permanently delete your account and all data.</p>
          </div>
        </div>

        {/* Warning Box */}
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50/80 p-4">
          <div className="flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <div className="space-y-2">
              <p className="font-semibold text-red-800">This action is permanent and cannot be undone.</p>
              <p>Deleting your account will:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Remove all personal information</li>
                <li>Delete all vehicle listings and wanted requests</li>
                <li>Remove your business profile (if applicable)</li>
                <li>Delete messages and conversations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={handleOpenModal}
          disabled={loading || checkingStatus}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkingStatus ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking account status...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete My Account
            </>
          )}
        </button>

        {/* Additional Info */}
        <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
          <strong>Note:</strong> Some data may be retained for legal compliance for up to 30 days after deletion. See our{' '}
          <a href="/privacy" className="font-medium text-blue-600 underline-offset-2 hover:underline">Privacy Policy</a>.
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
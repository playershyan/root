'use client'

import { useState } from 'react'
import { X, AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  userEmail?: string
  warnings?: string[]
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  warnings = []
}: DeleteAccountModalProps) {
  const [confirmPhrase, setConfirmPhrase] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: warnings, 2: confirmation

  if (!isOpen) return null

  const handleDelete = async () => {
    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      setError('Please type the exact phrase to confirm')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmPhrase,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Call the parent's onConfirm to handle post-deletion logic
      await onConfirm()
      
      // Redirect to homepage after successful deletion
      window.location.href = '/'
    } catch (err) {
      console.error('Error deleting account:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your account')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setConfirmPhrase('')
      setPassword('')
      setError('')
      setStep(1)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Account</h2>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <>
              {/* Warnings */}
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">
                    ⚠️ Permanent Deletion Warning
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    <li>Your profile and all personal information</li>
                    <li>All your vehicle listings</li>
                    <li>All your wanted requests</li>
                    <li>Your business profile (if applicable)</li>
                    <li>All messages and conversations</li>
                    <li>Your favorites and saved searches</li>
                  </ul>
                </div>

                {warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Active Content Warning
                    </h3>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Data Retention:</strong> Some data may be retained for up to 30 days 
                    for recovery purposes before permanent deletion. Legal and regulatory requirements 
                    may require us to retain certain information.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Continue with Deletion
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmation Form */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    You are about to permanently delete the account:
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">{userEmail}</p>
                </div>

                {/* Confirmation Phrase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE MY ACCOUNT</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    placeholder="Type the phrase here"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={loading}
                  />
                </div>

                {/* Password (Optional but recommended) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your password for security (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || confirmPhrase !== 'DELETE MY ACCOUNT'}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete My Account
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
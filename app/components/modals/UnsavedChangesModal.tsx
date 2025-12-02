'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onDiscard: () => void
  onCancel: () => void
  onClearAndStay?: () => void
}

export default function UnsavedChangesModal({
  isOpen,
  onDiscard,
  onCancel,
  onClearAndStay
}: UnsavedChangesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <X className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Unsaved Changes</h2>
              <p className="text-sm text-orange-100 mt-1">You have unsaved data in this form</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            You have unsaved changes that will be lost if you leave this page. Are you sure you want to discard your changes and continue?
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900">
                <p className="font-medium mb-1">This action cannot be undone</p>
                <p className="text-orange-700">All your form data will be permanently lost.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              size="default"
              className="flex-1"
            >
              Keep Editing
            </Button>
            <Button
              onClick={onDiscard}
              variant="primary"
              size="default"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Discard & Leave
            </Button>
          </div>
          {onClearAndStay && (
            <Button
              onClick={onClearAndStay}
              variant="danger"
              size="default"
              className="w-full"
            >
              Clear Form & Stay
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

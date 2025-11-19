'use client'

import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface SuccessPopupProps {
  isOpen: boolean
  onClose: () => void
  autoCloseDuration?: number
}

export default function SuccessPopup({
  isOpen,
  onClose,
  autoCloseDuration = 3000
}: SuccessPopupProps) {

  // Auto-close after duration
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDuration)

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose, autoCloseDuration])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="flex justify-center pt-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Listing Submitted Successfully!
          </h2>

          <p className="text-gray-600 leading-relaxed">
            Your listing has been successfully submitted and is currently under review.
            It will go live within 2-3 hours, and you will be notified via email once approved.
          </p>

          {/* Progress indicator */}
          <div className="pt-4">
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full animate-progress"
                style={{
                  animation: `progress ${autoCloseDuration}ms linear forwards`
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting you shortly...
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-progress {
          width: 0%;
        }
      `}</style>
    </div>
  )
}

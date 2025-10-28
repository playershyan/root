'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  persistent?: boolean
  onClose?: (id: string) => void
}

const toastStyles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: CheckCircle
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: AlertCircle
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info
  }
}

export function Toast({ id, message, type, duration = 5000, persistent = false, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const style = toastStyles[type]
  const Icon = style.icon

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Auto close after duration (unless persistent)
    if (!persistent) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, persistent])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose?.(id)
    }, 300) // Match animation duration
  }

  return (
    <div
      className={`
        flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border
        ${style.bg} ${style.border} ${style.text}
        transform transition-all duration-300 ease-out
        ${!isVisible || isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-white hover:bg-opacity-50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
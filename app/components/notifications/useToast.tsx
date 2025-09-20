'use client'

import { useState, useCallback } from 'react'
import { ToastProps, ToastType } from './Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = Date.now().toString()
    const toast: ToastProps = {
      id,
      message,
      type,
      duration
    }
    setToasts(prev => [...prev, toast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showError = useCallback((message: string, duration = 2000) => {
    return showToast(message, 'error', duration)
  }, [showToast])

  const showSuccess = useCallback((message: string, duration = 3000) => {
    return showToast(message, 'success', duration)
  }, [showToast])

  const showWarning = useCallback((message: string, duration = 3000) => {
    return showToast(message, 'warning', duration)
  }, [showToast])

  const showInfo = useCallback((message: string, duration = 3000) => {
    return showToast(message, 'info', duration)
  }, [showToast])

  return {
    toasts,
    showToast,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    removeToast
  }
}
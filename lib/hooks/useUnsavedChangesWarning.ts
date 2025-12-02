'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface UseUnsavedChangesWarningOptions {
  hasUnsavedChanges: boolean
  isSubmitting?: boolean
  onDiscard?: () => void
}

export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  isSubmitting = false,
  onDiscard
}: UseUnsavedChangesWarningOptions) {
  const router = useRouter()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const isNavigatingRef = useRef(false)

  // Block navigation to internal links
  useEffect(() => {
    if (!hasUnsavedChanges || isSubmitting) return

    const handleClick = (e: MouseEvent) => {
      // Don't block if already navigating or submitting
      if (isNavigatingRef.current || isSubmitting) return

      const target = e.target as HTMLElement
      const link = target.closest('a')

      if (link) {
        const href = link.getAttribute('href')

        // Only intercept internal links (starting with /)
        if (href && href.startsWith('/') && !href.startsWith('/#')) {
          // Don't block if clicking within the same page
          if (href === pathname || href === pathname + '/' || href === pathname.split('?')[0]) {
            return
          }

          e.preventDefault()
          e.stopPropagation()

          setPendingNavigation(href)
          setShowModal(true)
        }
      }
    }

    // Capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [hasUnsavedChanges, isSubmitting, pathname])

  const handleDiscard = useCallback(() => {
    isNavigatingRef.current = true
    setShowModal(false)

    // Call custom discard handler if provided
    if (onDiscard) {
      onDiscard()
    }

    // Navigate to pending URL
    if (pendingNavigation) {
      router.push(pendingNavigation)
      setPendingNavigation(null)
    }
  }, [pendingNavigation, router, onDiscard])

  const handleCancel = useCallback(() => {
    setShowModal(false)
    setPendingNavigation(null)
  }, [])

  return {
    showModal,
    handleDiscard,
    handleCancel
  }
}

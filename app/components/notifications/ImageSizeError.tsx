'use client'

import { Toast } from './Toast'

interface ImageSizeErrorProps {
  id: string
  onClose?: (id: string) => void
}

export function ImageSizeError({ id, onClose }: ImageSizeErrorProps) {
  return (
    <Toast
      id={id}
      message="Image exceeds 10MB"
      type="error"
      duration={2000}
      onClose={onClose}
    />
  )
}
'use client'

import { useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProfileImagePreviewProps {
  imageUrl: string
  onSave: (imageData: { url: string; position: { x: number; y: number }; zoom: number; rotation: number }) => void
  onCancel: () => void
}

export default function ProfileImagePreview({ imageUrl, onSave, onCancel }: ProfileImagePreviewProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Load image dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      // Center the image initially
      const containerSize = 400 // Preview container size
      const scale = Math.max(containerSize / img.width, containerSize / img.height)
      setZoom(scale)
    }
    img.src = imageUrl
  }, [imageUrl])

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleSave = () => {
    onSave({ url: imageUrl, position, zoom, rotation })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Adjust Profile Photo</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Container */}
        <div className="relative mb-6">
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ maxHeight: '400px', maxWidth: '400px', margin: '0 auto' }}
          >
            {/* Image */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Profile preview"
              className="absolute top-1/2 left-1/2 select-none"
              draggable={false}
              style={{
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                maxWidth: 'none',
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            />

            {/* Circular Cutout Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 400 400"
              style={{ width: '100%', height: '100%' }}
            >
              <defs>
                <mask id="circleMask">
                  <rect width="400" height="400" fill="white" />
                  <circle cx="200" cy="200" r="150" fill="black" />
                </mask>
              </defs>
              <rect
                width="400"
                height="400"
                fill="black"
                fillOpacity="0.6"
                mask="url(#circleMask)"
              />
              <circle
                cx="200"
                cy="200"
                r="150"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          </div>

          <p className="text-sm text-gray-500 text-center mt-2">
            Drag to reposition • Pinch or use buttons to zoom
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="gap-2"
          >
            <ZoomOut className="w-4 h-4" />
            Zoom Out
          </Button>

          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="gap-2"
          >
            <ZoomIn className="w-4 h-4" />
            Zoom In
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            className="gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Rotate
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
          >
            Save Photo
          </Button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import LocationFilter from '@/app/components/LocationFilter'
import { Button } from '@/components/ui/button'

interface HeroLocationPopupProps {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
}

export default function HeroLocationPopup({
  selectedLocation,
  onLocationChange
}: HeroLocationPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Close popup when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectLocation = (location: string | null) => {
    onLocationChange(location)
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className="truncate">
          {selectedLocation ? `Location: ${selectedLocation}` : 'Location (district or city)'}
        </span>
        <span className="ml-2 text-gray-400 text-xs flex items-center">
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[32rem] overflow-hidden">
          <div className="p-2">
            <LocationFilter
              selectedLocation={selectedLocation}
              onLocationChange={handleSelectLocation}
              expanded={true}
              onToggleExpand={() => {}}
              variant="compact"
              disableMaxHeight={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}




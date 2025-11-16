'use client'

import { Button } from '@/components/ui/button'
import { DISTRICTS, CITIES, POPULAR_LOCATIONS } from '@/lib/constants/locations'

interface HomeLocationQuickAccessProps {
  selectedLocation: string | null
  onLocationChange: (location: string | null) => void
}

export default function HomeLocationQuickAccess({
  selectedLocation,
  onLocationChange
}: HomeLocationQuickAccessProps) {
  const handleSelect = (location: string) => {
    onLocationChange(selectedLocation === location ? null : location)
  }

  // Try to find multilingual data for a given location name
  const getLocationMeta = (location: string) => {
    const district = DISTRICTS.find(d => d.name.toLowerCase() === location.toLowerCase())
    const city = CITIES.find(c => c.name.toLowerCase() === location.toLowerCase())
    return district || city
  }

  const quickLocations = POPULAR_LOCATIONS.slice(0, 8)

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500">QUICK ACCESS LOCATIONS</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {quickLocations.map(location => {
          const meta = getLocationMeta(location)

          return (
            <Button
              key={location}
              onClick={() => handleSelect(location)}
              variant={selectedLocation === location ? 'default' : 'outline'}
              size="default"
              className={`min-h-touch h-auto justify-start ${
                selectedLocation === location
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="text-left">
                <div className="font-medium text-sm">{location}</div>
                {meta && (meta.name_si || meta.name_ta) && (
                  <div className="text-xs opacity-75 mt-0.5">
                    {[meta.name_si, meta.name_ta].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}



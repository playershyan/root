import { useState, useCallback, useMemo } from 'react'
import { WantedRequest, FilterState } from '@/lib/types/wanted'

export function useWantedFilters(requests: WantedRequest[]) {
  const [filters, setFilters] = useState<FilterState>({
    locations: [],
    makes: [],
    models: [],
    minBudget: '',
    maxBudget: '',
    yearFrom: '',
    yearTo: '',
    fuelTypes: [],
    transmissions: [],
    urgencyLevels: []
  })

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    // Location filter
    if (filters.locations.length > 0) {
      filtered = filtered.filter(req => 
        filters.locations.some(loc => 
          req.location.toLowerCase().includes(loc.toLowerCase())
        )
      )
    }

    // Make filter
    if (filters.makes.length > 0) {
      filtered = filtered.filter(req => 
        req.make && filters.makes.includes(req.make)
      )
    }

    // Model filter
    if (filters.models.length > 0) {
      filtered = filtered.filter(req => 
        req.model && filters.models.includes(req.model)
      )
    }

    // Budget filter
    if (filters.minBudget) {
      const min = parseFloat(filters.minBudget)
      filtered = filtered.filter(req => 
        req.max_budget ? req.max_budget >= min : true
      )
    }
    if (filters.maxBudget) {
      const max = parseFloat(filters.maxBudget)
      filtered = filtered.filter(req => 
        req.min_budget ? req.min_budget <= max : true
      )
    }

    // Year filter
    if (filters.yearFrom) {
      const yearFrom = parseInt(filters.yearFrom)
      filtered = filtered.filter(req => 
        req.max_year ? req.max_year >= yearFrom : true
      )
    }
    if (filters.yearTo) {
      const yearTo = parseInt(filters.yearTo)
      filtered = filtered.filter(req => 
        req.min_year ? req.min_year <= yearTo : true
      )
    }

    // Fuel type filter
    if (filters.fuelTypes.length > 0) {
      filtered = filtered.filter(req => 
        req.fuel_type && filters.fuelTypes.includes(req.fuel_type)
      )
    }

    // Transmission filter
    if (filters.transmissions.length > 0) {
      filtered = filtered.filter(req => 
        req.transmission && filters.transmissions.includes(req.transmission)
      )
    }

    // Urgency filter
    if (filters.urgencyLevels.length > 0) {
      filtered = filtered.filter(req => 
        req.urgency && filters.urgencyLevels.includes(req.urgency)
      )
    }

    return filtered
  }, [requests, filters])

  const clearFilters = useCallback(() => {
    setFilters({
      locations: [],
      makes: [],
      models: [],
      minBudget: '',
      maxBudget: '',
      yearFrom: '',
      yearTo: '',
      fuelTypes: [],
      transmissions: [],
      urgencyLevels: []
    })
  }, [])

  return {
    filters,
    setFilters,
    filteredRequests,
    clearFilters
  }
}
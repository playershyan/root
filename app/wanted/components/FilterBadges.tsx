'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useCallback } from 'react'
import { X } from 'lucide-react'

export default function FilterBadges() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'All Makes' && value !== 'All Models' && value !== 'All of Sri Lanka') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filtering
    params.delete('page')
    router.push(`/wanted?${params.toString()}`)
  }, [searchParams, router])

  const activeFilterBadges = useMemo(() => {
    const badges: { label: string; onClear: () => void }[] = []
    
    const location = searchParams.get('location')
    if (location && location !== 'All of Sri Lanka') {
      badges.push({
        label: location,
        onClear: () => updateFilter({ location: null })
      })
    }

    const make = searchParams.get('make')
    if (make && make !== 'All Makes') {
      badges.push({
        label: make,
        onClear: () => updateFilter({ make: null, model: null })
      })
    }

    const model = searchParams.get('model')
    if (model && model !== 'All Models') {
      badges.push({
        label: model,
        onClear: () => updateFilter({ model: null })
      })
    }

    const minBudget = searchParams.get('minBudget')
    const maxBudget = searchParams.get('maxBudget')
    if (minBudget || maxBudget) {
      const budgetLabel = minBudget && maxBudget
        ? `Rs. ${parseInt(minBudget).toLocaleString()} - ${parseInt(maxBudget).toLocaleString()}`
        : minBudget
        ? `Rs. ${parseInt(minBudget).toLocaleString()}+`
        : `Up to Rs. ${parseInt(maxBudget).toLocaleString()}`
      badges.push({
        label: budgetLabel,
        onClear: () => updateFilter({ minBudget: null, maxBudget: null })
      })
    }

    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    if (yearFrom || yearTo) {
      const yearLabel = yearFrom && yearTo
        ? `${yearFrom} - ${yearTo}`
        : yearFrom
        ? `${yearFrom}+`
        : `Up to ${yearTo}`
      badges.push({
        label: `Year: ${yearLabel}`,
        onClear: () => updateFilter({ yearFrom: null, yearTo: null })
      })
    }

    const highPriorityOnly = searchParams.get('highPriorityOnly') === 'true'
    if (highPriorityOnly) {
      badges.push({
        label: 'High Priority Only',
        onClear: () => updateFilter({ highPriorityOnly: null })
      })
    }

    const sortBy = searchParams.get('sortBy')
    if (sortBy && sortBy !== 'recent') {
      const sortLabels: Record<string, string> = {
        'budget-high': 'Budget: High to Low',
        'budget-low': 'Budget: Low to High',
        'high-priority': 'High Priority First'
      }
      badges.push({
        label: sortLabels[sortBy] || sortBy,
        onClear: () => updateFilter({ sortBy: null })
      })
    }

    return badges
  }, [searchParams, updateFilter])

  if (activeFilterBadges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 mb-4">
      {activeFilterBadges.map((badge, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200"
        >
          {badge.label}
          <button
            onClick={badge.onClear}
            className="text-blue-500 transition-colors hover:text-blue-700 focus:outline-none"
            aria-label={`Remove ${badge.label} filter`}
          >
            <X size={14} />
          </button>
        </span>
      ))}
    </div>
  )
}


'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { BaseVehicleFormData, SAFETY_FEATURES, TECH_FEATURES, COMFORT_FEATURES } from './types'

interface FeaturesSectionProps {
  formData: BaseVehicleFormData
  setFormData: React.Dispatch<React.SetStateAction<BaseVehicleFormData>>
}

export default function FeaturesSection({ formData, setFormData }: FeaturesSectionProps) {
  return (
    <div className="border-t border-gray-200 pt-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          Features & Equipment
        </h2>
        <p className="text-gray-500 text-sm">Select all the features your vehicle has</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Safety Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SAFETY_FEATURES.map(feature => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, features: [...(prev.features || []), feature] }))
                    } else {
                      setFormData(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== feature) }))
                    }
                  }}
                  className="mr-3 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Technology Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TECH_FEATURES.map(feature => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, features: [...(prev.features || []), feature] }))
                    } else {
                      setFormData(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== feature) }))
                    }
                  }}
                  className="mr-3 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Comfort Features</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COMFORT_FEATURES.map(feature => (
              <label key={feature} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.features?.includes(feature) || false}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, features: [...(prev.features || []), feature] }))
                    } else {
                      setFormData(prev => ({ ...prev, features: (prev.features || []).filter(f => f !== feature) }))
                    }
                  }}
                  className="mr-3 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import React from 'react'
import { Info } from 'lucide-react'
import { BaseVehicleFormData } from './types'

interface AdditionalInformationSectionProps {
  formData: BaseVehicleFormData
  setFormData: React.Dispatch<React.SetStateAction<BaseVehicleFormData>>
  errors?: Record<string, string>
}

const VEHICLE_CONDITIONS = [
  { value: 'pristine', label: 'Pristine Condition' },
  { value: 'mint', label: 'Mint Condition' }
]

export default function AdditionalInformationSection({
  formData,
  setFormData,
  errors
}: AdditionalInformationSectionProps) {
  // Clear vehicle condition details and service records when main condition is "New"
  React.useEffect(() => {
    if (formData.condition === 'New') {
      const updates: any = {}
      if (formData.vehicleConditionDetails) {
        updates.vehicleConditionDetails = ''
      }
      if (formData.serviceRecordsAvailable) {
        updates.serviceRecordsAvailable = false
      }
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }))
      }
    }
  }, [formData.condition])
  return (
    <div className="border-t border-gray-200 pt-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          Additional Information <span className="text-sm font-normal text-gray-500">(facoltativo)</span>
        </h2>
        <p className="text-gray-500 text-sm">Provide more details about your vehicle</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interior Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interior Color
            </label>
            <input
              type="text"
              name="interiorColor"
              value={formData.interiorColor || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, interiorColor: e.target.value }))}
              placeholder="e.g., Black Leather, Beige Fabric"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors?.interiorColor ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors?.interiorColor && (
              <p className="text-red-600 text-sm mt-1">{errors.interiorColor}</p>
            )}
          </div>

          {/* Year of Registration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year of Registration
            </label>
            <input
              type="number"
              name="registrationYear"
              value={formData.registrationYear || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, registrationYear: e.target.value }))}
              placeholder="e.g., 2020"
              min="1900"
              max={new Date().getFullYear()}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors?.registrationYear ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors?.registrationYear && (
              <p className="text-red-600 text-sm mt-1">{errors.registrationYear}</p>
            )}
          </div>

          {/* Vehicle Condition - Only show if main condition is not "new" */}
          {formData.condition !== 'New' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Condition
              </label>
              <select
                name="vehicleConditionDetails"
                value={formData.vehicleConditionDetails || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleConditionDetails: e.target.value }))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                  errors?.vehicleConditionDetails ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Condition</option>
                {VEHICLE_CONDITIONS.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
              {errors?.vehicleConditionDetails && (
                <p className="text-red-600 text-sm mt-1">{errors.vehicleConditionDetails}</p>
              )}
            </div>
          )}

          {/* Number of Previous Owners */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Previous Owners
            </label>
            <input
              type="number"
              name="previousOwners"
              value={formData.previousOwners || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, previousOwners: e.target.value }))}
              placeholder="e.g., 1, 2"
              min="0"
              max="20"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors?.previousOwners ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors?.previousOwners && (
              <p className="text-red-600 text-sm mt-1">{errors.previousOwners}</p>
            )}

            {/* Including Finance Companies Checkbox */}
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={formData.includingFinanceCompanies || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  includingFinanceCompanies: e.target.checked
                }))}
                className="mr-2 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Including finance companies</span>
            </label>
          </div>
        </div>

        {/* Service Records Available - Only show if main condition is not "new" */}
        {formData.condition !== 'New' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.serviceRecordsAvailable || false}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  serviceRecordsAvailable: e.target.checked
                }))}
                className="mr-3 h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Service records available</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
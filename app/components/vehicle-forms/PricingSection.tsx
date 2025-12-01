'use client'

import React from 'react'
import { CreditCard } from 'lucide-react'
import { BaseVehicleFormData } from './types'

interface PricingSectionProps {
  formData: BaseVehicleFormData
  setFormData: React.Dispatch<React.SetStateAction<BaseVehicleFormData>>
  errors: Record<string, string>
  showPricingType?: boolean
}

export default function PricingSection({ formData, setFormData, errors, showPricingType = true }: PricingSectionProps) {
  return (
    <div className="border-t border-gray-200 pt-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
      </div>

      {showPricingType && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Sale Type <span className="text-red-500">*</span></label>
          <select
            name="pricingType"
            value={formData.pricingType || 'cash'}
            onChange={(e) => setFormData(prev => ({ ...prev, pricingType: e.target.value as 'cash' | 'finance' }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="cash">Regular Sale</option>
            <option value="finance">Finance Transfer</option>
          </select>
        </div>
      )}

      {(!showPricingType || formData.pricingType === 'cash') ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price (LKR) <span className="text-red-500">*</span></label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="e.g., 5500000"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
              errors.price ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="text-red-600 text-sm mt-1">{errors.price}</p>}
          
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Price is negotiable</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.negotiable}
                onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      ) : (
        // Finance section (keeping the existing finance form)
        <div className="space-y-6">
          {/* Financial Details */}
          <div className="bg-white border border-gray-300 rounded-lg p-5">
            <h4 className="text-base font-medium text-gray-900 mb-4">Financial Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding Balance</label>
                <input
                  type="number"
                  name="outstandingBalance"
                  value={formData.outstandingBalance || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, outstandingBalance: e.target.value, price: e.target.value }))}
                  placeholder="e.g., 3500000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.outstandingBalance ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount still owed to the finance company
                </p>
                {errors.outstandingBalance && <p className="text-red-600 text-sm mt-1">{errors.outstandingBalance}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asking Price <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="askingPrice"
                  value={formData.askingPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, askingPrice: e.target.value }))}
                  placeholder="e.g., 3200000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.askingPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <div className="mt-3 flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Price is negotiable</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.negotiable}
                      onChange={(e) => setFormData(prev => ({ ...prev, negotiable: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  What you're asking for the takeover
                </p>
                {errors.askingPrice && <p className="text-red-600 text-sm mt-1">{errors.askingPrice}</p>}
              </div>
            </div>
          </div>

          {/* Current Payment Terms */}
          <div className="bg-white border border-gray-300 rounded-lg p-5">
            <h4 className="text-base font-medium text-gray-900 mb-4">Current Payment Terms</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Payment</label>
                <input
                  type="number"
                  name="monthlyPayment"
                  value={formData.monthlyPayment || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPayment: e.target.value }))}
                  placeholder="e.g., 65000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.monthlyPayment ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current monthly payment amount
                </p>
                {errors.monthlyPayment && <p className="text-red-600 text-sm mt-1">{errors.monthlyPayment}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Term</label>
                <input
                  type="text"
                  name="remainingTerm"
                  value={formData.remainingTerm || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingTerm: e.target.value }))}
                  placeholder="e.g., 36 months, 2 years"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.remainingTerm ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time left on the finance agreement
                </p>
                {errors.remainingTerm && <p className="text-red-600 text-sm mt-1">{errors.remainingTerm}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
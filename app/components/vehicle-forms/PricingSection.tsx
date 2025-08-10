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
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          Pricing
        </h2>
        <p className="text-gray-500 text-sm">Set your price or finance details</p>
      </div>

      {showPricingType && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Sale Type</label>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-1 rounded-lg flex border border-green-200">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pricingType: 'cash' }))}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                formData.pricingType === 'cash'
                  ? 'bg-white shadow-md text-green-700 border border-green-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-base">💵</span>
              Regular Sale
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, pricingType: 'finance' }))}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                formData.pricingType === 'finance'
                  ? 'bg-white shadow-md text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <span className="text-base">🏦</span>
              Finance Transfer
            </button>
          </div>
          {formData.pricingType && (
            <p className={`text-xs mt-2 font-medium ${
              formData.pricingType === 'cash' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {formData.pricingType === 'cash' 
                ? '✓ Selling for cash payment - set your asking price' 
                : '✓ Transferring finance agreement - buyer takes over payments'
              }
            </p>
          )}
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
          {/* Finance Provider Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              Finance Provider Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Finance Type <span className="text-red-500">*</span></label>
                <select
                  name="financeType"
                  value={formData.financeType || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, financeType: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.financeType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="Bank Loan">Bank Loan</option>
                  <option value="Lease">Lease</option>
                  <option value="Hire Purchase">Hire Purchase</option>
                </select>
                {errors.financeType && <p className="text-red-600 text-sm mt-1">{errors.financeType}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Finance Provider</label>
                <input
                  type="text"
                  name="financeProvider"
                  value={formData.financeProvider || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, financeProvider: e.target.value }))}
                  placeholder="e.g., Commercial Bank, People's Leasing"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Current Payment Terms */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              Current Payment Terms
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Payment <span className="text-red-500">*</span></label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Remaining Term <span className="text-red-500">*</span></label>
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

          {/* Financial Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              Financial Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding Balance <span className="text-red-500">*</span></label>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Original Loan Amount</label>
                <input
                  type="number"
                  name="originalAmount"
                  value={formData.originalAmount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, originalAmount: e.target.value }))}
                  placeholder="e.g., 6000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Original amount financed (optional)
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Early Settlement Terms</label>
                <textarea
                  name="earlySettlement"
                  value={formData.earlySettlement || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, earlySettlement: e.target.value }))}
                  placeholder="e.g., Allowed with 2% penalty, No penalty after 6 months, Contact bank for settlement amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Early settlement conditions or penalties (optional)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
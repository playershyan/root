'use client'

import React, { useState, useEffect, useRef } from 'react'
import { VehicleFormProps, FUEL_TYPES, TRANSMISSION_TYPES, VEHICLE_CONDITIONS, COLORS } from './types'

interface BaseVehicleFormConfig {
  showModel?: boolean
  showYear?: boolean
  showMileage?: boolean
  showTrim?: boolean
  showEngineCapacity?: boolean
  showFuelType?: boolean
  showTransmission?: boolean
  showColor?: boolean
  showPricingType?: boolean
  showFeatures?: boolean
  modelRequired?: boolean
  mileageRequired?: boolean
  trimRequired?: boolean
  engineCapacityRequired?: boolean
  transmissionRequired?: boolean
}

interface BaseVehicleFormExtendedProps extends VehicleFormProps {
  config: BaseVehicleFormConfig
}

export default function BaseVehicleForm({ 
  formData, 
  setFormData, 
  errors, 
  getMakeOptions, 
  getModelOptions,
  config 
}: BaseVehicleFormExtendedProps) {

  const [makeSearch, setMakeSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [showMakeDropdown, setShowMakeDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const makeDropdownRef = useRef<HTMLDivElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i)

  // Filter makes based on search
  const filteredMakes = getMakeOptions().filter(make => 
    make.name.toLowerCase().includes(makeSearch.toLowerCase())
  )

  // Filter models based on search
  const filteredModels = getModelOptions().filter(model => 
    model.toLowerCase().includes(modelSearch.toLowerCase())
  )

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (makeDropdownRef.current && !makeDropdownRef.current.contains(event.target as Node)) {
        setShowMakeDropdown(false)
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMakeSelect = (makeName: string) => {
    setFormData(prev => ({ ...prev, make: makeName, model: '', customMake: '' }))
    setMakeSearch(makeName)
    setShowMakeDropdown(false)
  }

  const handleModelSelect = (modelName: string) => {
    setFormData(prev => ({ ...prev, model: modelName, customModel: '' }))
    setModelSearch(modelName)
    setShowModelDropdown(false)
  }

  // Update search when formData changes
  useEffect(() => {
    if (formData.make && formData.make !== 'Other') {
      setMakeSearch(formData.make)
    }
    if (formData.model && formData.model !== 'Other') {
      setModelSearch(formData.model || '')
    }
  }, [formData.make, formData.model])

  return (
    <>
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Listing Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., 2019 Toyota Prius - Excellent Condition"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Make */}
        <div ref={makeDropdownRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Make <span className="text-red-500">*</span>
          </label>
          {formData.make === 'Other' ? (
            <div className="space-y-2">
              <input
                type="text"
                name="customMake"
                value={formData.customMake || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, customMake: e.target.value }))}
                placeholder="Enter make name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                  errors.make ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, make: '', customMake: '', model: '' }))
                  setMakeSearch('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to search
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                value={makeSearch}
                onChange={(e) => {
                  setMakeSearch(e.target.value)
                  setShowMakeDropdown(true)
                }}
                onFocus={() => setShowMakeDropdown(true)}
                placeholder="Search make..."
                disabled={!formData.vehicleType}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                  errors.make ? 'border-red-300' : 'border-gray-300'
                } ${!formData.vehicleType ? 'bg-gray-50' : ''}`}
              />
              {showMakeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredMakes.length > 0 ? (
                    <>
                      {filteredMakes.map(make => (
                        <div
                          key={make.id}
                          onClick={() => handleMakeSelect(make.name)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          {make.name}
                        </div>
                      ))}
                      <div
                        onClick={() => {
                          setFormData(prev => ({ ...prev, make: 'Other', model: '', customMake: '' }))
                          setShowMakeDropdown(false)
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 border-t border-gray-200"
                      >
                        Other (Type custom make)
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-2 text-gray-500">
                      No makes found. 
                      <span 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, make: 'Other', model: '', customMake: '' }))
                          setShowMakeDropdown(false)
                        }}
                        className="text-blue-600 cursor-pointer ml-1"
                      >
                        Add custom make?
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {errors.make && <p className="text-red-600 text-sm mt-1">{errors.make}</p>}
        </div>

        {/* Model */}
        {config.showModel !== false && (
          <div ref={modelDropdownRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model {config.modelRequired !== false && <span className="text-red-500">*</span>}
            </label>
            {formData.model === 'Other' ? (
              <div className="space-y-2">
                <input
                  type="text"
                  name="customModel"
                  value={formData.customModel || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, customModel: e.target.value }))}
                  placeholder="Enter model name"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.model ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, model: '', customModel: '' }))
                    setModelSearch('')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to search
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => {
                    setModelSearch(e.target.value)
                    setShowModelDropdown(true)
                  }}
                  onFocus={() => setShowModelDropdown(true)}
                  placeholder="Search model..."
                  disabled={!formData.make}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                    errors.model ? 'border-red-300' : 'border-gray-300'
                  } ${!formData.make ? 'bg-gray-50' : ''}`}
                />
                {showModelDropdown && formData.make && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      <>
                        {filteredModels.map(model => (
                          <div
                            key={model}
                            onClick={() => handleModelSelect(model)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            {model}
                          </div>
                        ))}
                        <div
                          onClick={() => {
                            setFormData(prev => ({ ...prev, model: 'Other', customModel: '' }))
                            setShowModelDropdown(false)
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-blue-600 border-t border-gray-200"
                        >
                          Other (Type custom model)
                        </div>
                      </>
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        No models found. 
                        <span 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, model: 'Other', customModel: '' }))
                            setShowModelDropdown(false)
                          }}
                          className="text-blue-600 cursor-pointer ml-1"
                        >
                          Add custom model?
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {errors.model && <p className="text-red-600 text-sm mt-1">{errors.model}</p>}
          </div>
        )}

        {/* Year */}
        {config.showYear !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year <span className="text-red-500">*</span>
            </label>
            <select
              name="year"
              value={formData.year || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors.year ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.year && <p className="text-red-600 text-sm mt-1">{errors.year}</p>}
          </div>
        )}

        {/* Mileage */}
        {config.showMileage !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mileage (km) {config.mileageRequired !== false && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
              placeholder="e.g., 45000"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors.mileage ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.mileage && <p className="text-red-600 text-sm mt-1">{errors.mileage}</p>}
          </div>
        )}

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition <span className="text-red-500">*</span>
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
              errors.condition ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select Condition</option>
            {VEHICLE_CONDITIONS.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
          {errors.condition && <p className="text-red-600 text-sm mt-1">{errors.condition}</p>}
        </div>

        {/* Trim/Grade */}
        {config.showTrim !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trim/Grade {config.trimRequired !== false && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="trim"
              value={formData.trim || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, trim: e.target.value }))}
              placeholder="e.g., EX, LX, Grande, Sports, Premium"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors.trim ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.trim && <p className="text-red-600 text-sm mt-1">{errors.trim}</p>}
          </div>
        )}

        {/* Engine Capacity */}
        {config.showEngineCapacity !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engine Capacity (cc) {config.engineCapacityRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              name="engineCapacity"
              value={formData.engineCapacity || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, engineCapacity: e.target.value }))}
              placeholder="e.g., 1800"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors.engineCapacity ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.engineCapacity && <p className="text-red-600 text-sm mt-1">{errors.engineCapacity}</p>}
          </div>
        )}

        {/* Fuel Type */}
        {config.showFuelType !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
            <select
              name="fuelType"
              value={formData.fuelType || 'Petrol'}
              onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              {FUEL_TYPES.map(fuel => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>
          </div>
        )}

        {/* Transmission */}
        {config.showTransmission !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transmission {config.transmissionRequired && <span className="text-red-500">*</span>}
            </label>
            <select
              name="transmission"
              value={formData.transmission || 'Manual'}
              onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${
                errors.transmission ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {TRANSMISSION_TYPES.map(trans => (
                <option key={trans} value={trans}>{trans}</option>
              ))}
            </select>
            {errors.transmission && <p className="text-red-600 text-sm mt-1">{errors.transmission}</p>}
          </div>
        )}

        {/* Color */}
        {config.showColor !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <select
              name="color"
              value={formData.color || 'White'}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            >
              {COLORS.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </>
  )
}
'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import CarForm from './CarForm'
import VanForm from './VanForm'
import BusForm from './BusForm'
import LorryForm from './LorryForm'
import MotorcycleForm from './MotorcycleForm'
import ThreeWheelerForm from './ThreeWheelerForm'
import BicycleForm from './BicycleForm'
import PlantMachineryForm from './PlantMachineryForm'
import TractorForm from './TractorForm'
import BoatForm from './BoatForm'
import PricingSection from './PricingSection'
import FeaturesSection from './FeaturesSection'
import { FileText } from 'lucide-react'

interface VehicleFormFactoryProps {
  vehicleType: string
  formData: any
  setFormData: any
  errors: Record<string, string>
  getMakeOptions: () => any[]
  getModelOptions: () => string[]
}

export default function VehicleFormFactory(props: VehicleFormFactoryProps) {
  const { vehicleType, formData, setFormData, errors } = props

  // Get the appropriate form component
  const getFormComponent = () => {
    switch (vehicleType) {
      case 'car':
        return <CarForm {...props} />
      case 'van':
        return <VanForm {...props} />
      case 'bus':
        return <BusForm {...props} />
      case 'lorry':
        return <LorryForm {...props} />
      case 'motorcycle':
        return <MotorcycleForm {...props} />
      case 'three-wheeler':
        return <ThreeWheelerForm {...props} />
      case 'bicycle':
        return <BicycleForm {...props} />
      case 'plant-machinery':
        return <PlantMachineryForm {...props} />
      case 'tractor':
        return <TractorForm {...props} />
      case 'boat':
        return <BoatForm {...props} />
      default:
        return null
    }
  }

  // Determine if pricing type should be shown
  const shouldShowPricingType = () => {
    return vehicleType !== 'bicycle'
  }

  // Determine if features section should be shown
  const shouldShowFeatures = () => {
    return !['bicycle', 'motorcycle', 'three-wheeler', 'plant-machinery', 'tractor', 'boat'].includes(vehicleType)
  }

  if (!vehicleType) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Basic Vehicle Details */}
      <div className="border-t border-gray-200 pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            Basic Vehicle Information
          </h2>
          <p className="text-gray-500 text-sm">Tell us about your vehicle's details</p>
        </div>
        {getFormComponent()}
      </div>

      {/* Features Section */}
      {shouldShowFeatures() && (
        <FeaturesSection 
          formData={formData}
          setFormData={setFormData}
        />
      )}

      {/* Pricing Section */}
      <PricingSection 
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        showPricingType={shouldShowPricingType()}
      />
    </div>
  )
}
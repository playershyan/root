'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function TractorForm(props: VehicleFormProps) {
  const config = {
    showModel: true,
    showYear: true,
    showMileage: true,
    showTrim: false,
    showEngineCapacity: true,
    showFuelType: true,
    showTransmission: true,
    showColor: false,
    showPricingType: true,
    showFeatures: false,
    modelRequired: false, // Optional for tractors
    mileageRequired: false, // Optional for tractors
    trimRequired: false,
    engineCapacityRequired: false,
    transmissionRequired: false
  }

  return <BaseVehicleForm {...props} config={config} />
}
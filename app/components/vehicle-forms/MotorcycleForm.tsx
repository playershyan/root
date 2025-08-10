'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function MotorcycleForm(props: VehicleFormProps) {
  const config = {
    showModel: true,
    showYear: true,
    showMileage: true,
    showTrim: false,
    showEngineCapacity: true,
    showFuelType: true,
    showTransmission: false,
    showColor: false,
    showPricingType: true,
    showFeatures: false,
    modelRequired: false, // Optional for motorcycles
    mileageRequired: true,
    trimRequired: false,
    engineCapacityRequired: false,
    transmissionRequired: false
  }

  return <BaseVehicleForm {...props} config={config} />
}
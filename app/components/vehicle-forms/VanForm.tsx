'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function VanForm(props: VehicleFormProps) {
  const config = {
    showModel: true,
    showYear: true,
    showMileage: true,
    showTrim: true,
    showEngineCapacity: true,
    showFuelType: true,
    showTransmission: true,
    showColor: true,
    showPricingType: true,
    showFeatures: true,
    modelRequired: false, // Optional for vans
    mileageRequired: true,
    trimRequired: false, // Optional for vans
    engineCapacityRequired: false,
    transmissionRequired: false
  }

  return <BaseVehicleForm {...props} config={config} />
}
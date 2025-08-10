'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function BicycleForm(props: VehicleFormProps) {
  const config = {
    showModel: false,
    showYear: false,
    showMileage: false,
    showTrim: false,
    showEngineCapacity: false,
    showFuelType: false,
    showTransmission: false,
    showColor: false,
    showPricingType: false,
    showFeatures: false,
    modelRequired: false,
    mileageRequired: false,
    trimRequired: false,
    engineCapacityRequired: false,
    transmissionRequired: false
  }

  return <BaseVehicleForm {...props} config={config} />
}
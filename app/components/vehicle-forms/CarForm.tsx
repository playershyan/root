'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function CarForm(props: VehicleFormProps) {
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
    modelRequired: true,
    mileageRequired: true,
    trimRequired: true,
    engineCapacityRequired: false,
    transmissionRequired: false
  }

  return <BaseVehicleForm {...props} config={config} />
}
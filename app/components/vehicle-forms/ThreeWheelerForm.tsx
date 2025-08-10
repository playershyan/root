'use client'

import React from 'react'
import { VehicleFormProps } from './types'
import BaseVehicleForm from './BaseVehicleForm'

export default function ThreeWheelerForm(props: VehicleFormProps) {
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
    modelRequired: false, // Optional for three-wheelers
    mileageRequired: true,
    trimRequired: false,
    engineCapacityRequired: false, // Optional for three-wheelers
    transmissionRequired: false // Optional for three-wheelers
  }

  return <BaseVehicleForm {...props} config={config} />
}
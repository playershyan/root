'use client'

import React from 'react'
import { BaseVehicleFormData } from './types'

interface AdditionalInformationSectionProps {
  formData: BaseVehicleFormData
  setFormData: React.Dispatch<React.SetStateAction<BaseVehicleFormData>>
  errors?: Record<string, string>
}

// This component has been deprecated as all optional fields have been removed
// Keeping the file for backwards compatibility but it renders nothing
export default function AdditionalInformationSection({
  formData,
  setFormData,
  errors
}: AdditionalInformationSectionProps) {
  return null
}

'use client'

import { useState } from 'react'

export default function TestPage() {
  const [test, setTest] = useState('')
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1>Test</h1>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '@/lib/utils/logger'

export default function TestAuthPage() {
  const { user, loading } = useAuth()
  const [apiResult, setApiResult] = useState<string>('')
  
  const testAdminAPI = async () => {
    try {
      logger.debug('Testing admin API', {
        component: 'TestAuthPage',
        action: 'testAdminAPI'
      })
      const response = await fetch('/api/admin/listings?limit=1')
      const data = await response.text()
      logger.debug('API response received', {
        component: 'TestAuthPage',
        action: 'testAdminAPI',
        status: response.status
      })
      setApiResult(`Status: ${response.status}\n\nBody: ${data}`)
    } catch (error) {
      logger.error('API test failed', error as Error, {
        component: 'TestAuthPage',
        action: 'testAdminAPI'
      })
      setApiResult(`Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Auth Context Status:</h2>
            <p>Loading: {loading.toString()}</p>
            <p>User ID: {user?.id || 'No user'}</p>
            <p>User Email: {user?.email || 'No email'}</p>
          </div>

          <div>
            <button 
              onClick={testAdminAPI}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Admin API
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold">API Response:</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {apiResult || 'Click button to test API'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
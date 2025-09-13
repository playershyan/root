'use client'

import { useState } from 'react'
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'

export default function RecaptchaTestPage() {
  const { getToken, isEnabled, isLoading, error } = useRecaptcha()
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState<string>('idle')

  const handleVerify = async () => {
    setStatus('getting-token')
    const token = await getToken('test')
    if (!token) {
      setStatus('no-token')
      setResult({ error: 'No token' })
      return
    }
    setStatus('verifying')
    const res = await fetch('/api/security/verify-recaptcha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recaptchaToken: token })
    })
    const data = await res.json()
    setResult(data)
    setStatus(res.ok ? 'ok' : 'error')
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">reCAPTCHA Test</h1>
      {!isEnabled && (
        <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded">Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY to enable client token.</div>
      )}
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded">{error}</div>
      )}
      <button
        onClick={handleVerify}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {status === 'verifying' ? 'Verifying…' : 'Verify reCAPTCHA'}
      </button>
      {result && (
        <pre className="mt-4 p-3 bg-gray-50 border rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}


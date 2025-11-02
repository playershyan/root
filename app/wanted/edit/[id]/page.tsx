'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function EditWantedRequestRedirect() {
  const router = useRouter()
  const params = useParams()
  const requestId = params?.id as string

  useEffect(() => {
    if (requestId) {
      router.replace(`/wanted/post?edit=${requestId}`)
    }
  }, [requestId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to edit page...</p>
      </div>
    </div>
  )
}

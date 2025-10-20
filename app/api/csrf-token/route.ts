import { NextRequest } from 'next/server'
import { createCSRFTokenResponse } from '../../../lib/middleware/csrfProtection'

export async function GET(request: NextRequest) {
  // Get CSRF secret from environment (optional)
  const secret = process.env.CSRF_SECRET
  
  return createCSRFTokenResponse({ secret })
}

export async function POST(request: NextRequest) {
  // For consistency, also allow POST requests to get CSRF token
  return GET(request)
}
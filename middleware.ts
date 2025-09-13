import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { withRateLimit, rateLimiters } from './lib/middleware/rateLimiter'
import { VEHICLE_DATA } from './lib/constants/vehicleData'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // Apply rate limiting to API routes
    if (req.nextUrl.pathname.startsWith('/api')) {
    // Determine which rate limiter to use based on the path
    let rateLimiter = rateLimiters.api // Default API rate limit
    
    if (req.nextUrl.pathname.startsWith('/api/auth')) {
      rateLimiter = rateLimiters.auth
    } else if (req.nextUrl.pathname.startsWith('/api/search')) {
      rateLimiter = rateLimiters.search
    } else if (req.nextUrl.pathname.startsWith('/api/upload')) {
      rateLimiter = rateLimiters.upload
    } else if (req.nextUrl.pathname.startsWith('/api/messages') || 
               req.nextUrl.pathname.startsWith('/api/messaging')) {
      rateLimiter = rateLimiters.messaging
    } else if (req.nextUrl.pathname.startsWith('/api/ai-') || 
               req.nextUrl.pathname.startsWith('/api/generate-ai')) {
      rateLimiter = rateLimiters.ai
    } else if (req.nextUrl.pathname.startsWith('/api/admin')) {
      rateLimiter = rateLimiters.admin
    } else if (req.nextUrl.pathname.includes('/delete') || 
               req.nextUrl.pathname.includes('/delete-account')) {
      rateLimiter = rateLimiters.strict
    }
    
    const rateLimitResponse = await withRateLimit(req, rateLimiter)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Additional daily cap for AI endpoints to prevent abuse
    if (req.nextUrl.pathname.startsWith('/api/ai-') ||
        req.nextUrl.pathname.startsWith('/api/generate-ai')) {
      const dailyCapResponse = await withRateLimit(req, rateLimiters.aiDaily)
      if (dailyCapResponse) {
        return dailyCapResponse
      }
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/profile', '/post', '/wanted/post', '/messages', '/admin']
  const authRoutes = ['/login', '/register']

  const path = req.nextUrl.pathname

  // Map internal search queries like /listings?q=toyota+prius to clean landing pages
  if (path === '/listings') {
    const q = req.nextUrl.searchParams.get('q')
    const intent = req.nextUrl.searchParams.get('intent')
    if (q && intent !== 'refine') {
      const mapped = tryMapQueryToMakeModel(q)
      if (mapped) {
        const url = new URL(`/lk/cars/${mapped.makeId}/${mapped.modelSlug}`, req.url)
        return NextResponse.redirect(url, 301)
      }
    }
  }

  // Remove console.log statements in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('Middleware - Path:', path)
    console.log('Middleware - Session exists:', !!session)
    console.log('Middleware - Session user:', session?.user?.email)
  }

  // If user is not logged in and trying to access protected route
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Middleware - Redirecting to login, no session found')
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is logged in and trying to access auth routes
  if (session && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/api/:path*',
    '/profile/:path*', 
    '/post/:path*', 
    '/wanted/:path*', 
    '/messages/:path*', 
    '/admin/:path*', 
    '/login', 
    '/register'
  ]
}

function tryMapQueryToMakeModel(raw: string): { makeId: string; modelSlug: string } | null {
  const carCat = VEHICLE_DATA?.categories?.['car']
  if (!carCat) return null

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const q = normalize(raw)

  for (const make of carCat.makes) {
    const makeNames = [make.id.toLowerCase(), make.name.toLowerCase()]
    const hasMake = makeNames.some((m) => q.includes(m))
    if (!hasMake) continue

    // find model token within query
    for (const model of make.models) {
      const modelNorm = model.toLowerCase()
      const modelSlug = slugify(model)
      if (q.includes(modelNorm) || q.includes(modelSlug.replace(/-/g, ' '))) {
        return { makeId: make.id, modelSlug }
      }
    }
  }

  return null
}

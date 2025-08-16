import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/profile', '/post', '/wanted/post', '/messages']
  const authRoutes = ['/login', '/register']

  const path = req.nextUrl.pathname

  // If user is not logged in and trying to access protected route
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is logged in and trying to access auth routes
  if (session && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }

  return res
}

export const config = {
  matcher: ['/profile/:path*', '/post/:path*', '/wanted/:path*', '/messages/:path*', '/login', '/register']
}
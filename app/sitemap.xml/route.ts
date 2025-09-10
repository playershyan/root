import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vera.lk'
  
  // Define all public routes that should be indexed
  const staticRoutes = [
    '',                    // Home page
    '/about',             // About us
    '/listings',          // Vehicle listings
    '/wanted',            // Wanted requests
    '/dealers',           // Dealers directory
    '/ai-features',       // AI features page
    '/careers',           // Careers page
    '/safety',            // Safety page
    '/terms',             // Terms of service
    '/privacy',           // Privacy policy
    '/post',              // Post listing (public access)
    '/wanted/post',       // Post wanted request (public access)
    '/register',          // Registration
    '/login',             // Login
    '/forgot-password',   // Password recovery
    '/sitemap',           // HTML sitemap
  ]

  // Routes to exclude from sitemap (internal/admin/test routes)
  const excludedRoutes = [
    '/admin',
    '/admin/setup',
    '/profile',
    '/test-auth',
    '/test/cloudinary',
    '/forgot-password',
    '/post/boost',
    '/post/paid-features',
    '/wanted/post/boost',
    '/wanted-request/paid-features',
    '/wanted/edit',
    '/business',
    '/dealer',
  ]

  const currentDate = new Date().toISOString()

  // Generate XML for static routes
  const staticUrlsXml = staticRoutes.map(route => {
    // Determine priority and change frequency based on page type
    let priority = '0.8'
    let changefreq = 'weekly'
    
    if (route === '') {
      priority = '1.0'
      changefreq = 'daily'
    } else if (route === '/listings' || route === '/wanted') {
      priority = '0.9'
      changefreq = 'daily'
    } else if (route.includes('terms') || route.includes('privacy')) {
      priority = '0.3'
      changefreq = 'monthly'
    }

    return `
  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  }).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrlsXml}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  })
}
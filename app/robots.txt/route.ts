import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vera.lk'
  
  const robotsTxt = `User-agent: *
Allow: /
Allow: /listings
Allow: /wanted
Allow: /dealers
Allow: /about
Allow: /ai-features
Allow: /safety
Allow: /careers
Allow: /terms
Allow: /privacy
Allow: /post
Allow: /wanted/post
Allow: /register
Allow: /login
Allow: /sitemap

# Disallow private/admin areas
Disallow: /admin/
Disallow: /profile/
Disallow: /api/
Disallow: /test/
Disallow: /test-auth
Disallow: /_next/
Disallow: /forgot-password
Disallow: /post/boost
Disallow: /post/paid-features
Disallow: /wanted/post/boost
Disallow: /wanted-request/paid-features
Disallow: /wanted/edit/
Disallow: /business/
Disallow: /dealer/

# Allow specific API endpoints that might be useful for crawlers
Allow: /api/search
Allow: /api/health

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  })
}
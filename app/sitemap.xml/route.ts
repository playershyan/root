import { NextResponse } from 'next/server'
import { VEHICLE_DATA } from '@/lib/constants/vehicleData'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vera.lk'
  
  // Define all public routes that should be indexed
  const staticRoutes = [
    '',                    // Home page
    '/about',             // About us
    '/listings',          // Vehicle listings
    '/wanted',            // Wanted requests
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

  // Generate make/model URLs for cars in LK based on active inventory
  const carCategory = VEHICLE_DATA.categories['car']
  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const makeModelUrls: string[] = []
  if (carCategory) {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { data: pairs, error } = await supabase
        .from('listings')
        .select('make,model')
        .eq('is_sold', false)
        .eq('status', 'active')
        .eq('vehicle_type', 'car')
        .limit(10000)

      if (!error && pairs) {
        // Build sets for make and make+model combos present in inventory
        const presentMakes = new Set<string>()
        const presentCombos = new Set<string>()
        for (const row of pairs as any[]) {
          const makeName = (row.make || '').toString().toLowerCase()
          const modelName = (row.model || '').toString().toLowerCase()
          const makeObj = carCategory.makes.find(m => m.name.toLowerCase() === makeName || m.id.toLowerCase() === makeName)
          if (!makeObj) continue
          presentMakes.add(makeObj.id)

          // Match model against catalog names to get slug
          const matchModel = makeObj.models.find(m => m.toLowerCase() === modelName)
          if (matchModel) {
            presentCombos.add(`${makeObj.id}::${slugify(matchModel)}`)
          }
        }

        // Emit make pages
        for (const makeId of presentMakes) {
          makeModelUrls.push(`<url>\n    <loc>${baseUrl}/lk/cars/${makeId}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`)
        }
        // Emit model pages
        for (const combo of presentCombos) {
          const [makeId, modelSlug] = combo.split('::')
          makeModelUrls.push(`<url>\n    <loc>${baseUrl}/lk/cars/${makeId}/${modelSlug}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`)
        }
      }
    } catch (e) {
      // Fallback: do nothing; we still return static URLs
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticUrlsXml}
  ${makeModelUrls.join('')}
</urlset>`

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  })
}

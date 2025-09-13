import { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { VEHICLE_DATA } from '@/lib/constants/vehicleData'

type PageParams = {
  params: {
    make: string
    model: string
  }
}

function toTitleCase(str: string) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function findMakeModel(makeSlug: string, modelSlug: string) {
  const category = VEHICLE_DATA.categories['car']
  if (!category) return { makeId: null as string | null, makeName: null as string | null, modelName: null as string | null }

  const make = category.makes.find(
    (m) => m.id.toLowerCase() === makeSlug.toLowerCase() || m.name.toLowerCase() === makeSlug.toLowerCase()
  )
  if (!make) return { makeId: null, makeName: null, modelName: null }

  // Match model by slugifying the known model names
  const target = modelSlug.toLowerCase()
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const modelName = make.models.find((name) => normalize(name) === target) || toTitleCase(modelSlug)

  return { makeId: make.id, makeName: make.name, modelName }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
  const { make, model } = params
  const { makeName, modelName } = findMakeModel(make, model)
  const titleMake = makeName || toTitleCase(make)
  const titleModel = modelName || toTitleCase(model)
  const title = `${titleMake} ${titleModel} for Sale in Sri Lanka | VERA`
  const canonical = `${baseUrl}/lk/cars/${encodeURIComponent(make)}/${encodeURIComponent(model)}`

  // Count current active listings for this combo for better meta and indexing control
  const supabase = createServerComponentClient({ cookies })
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('is_sold', false)
    .eq('status', 'active')
    .eq('vehicle_type', 'car')
    .ilike('make', titleMake)
    .ilike('model', titleModel)

  const hasResults = (count || 0) > 0
  const description = hasResults
    ? `Browse ${count} ${titleMake} ${titleModel} listings for sale in Sri Lanka. Compare prices, mileage, year, and contact sellers on VERA.`
    : `See current availability of ${titleMake} ${titleModel} cars in Sri Lanka and explore similar models on VERA.`

  return {
    title,
    description,
    alternates: { canonical, languages: { 'en-LK': canonical, 'x-default': canonical } },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: hasResults,
      follow: true
    }
  }
}

export default async function MakeModelListingsPage({ params }: PageParams) {
  const { make, model } = params
  const { makeId, makeName, modelName } = findMakeModel(make, model)

  const supabase = createServerComponentClient({ cookies })

  // Fetch top listings for SEO rendering (server-side)
  const { data: listings } = await supabase
    .from('listings')
    .select('id,title,price,year,mileage,fuel_type,location,image_url,image_urls,make,model,created_at,vehicle_type,is_sold,status')
    .eq('is_sold', false)
    .eq('status', 'active')
    .eq('vehicle_type', 'car')
    .ilike('make', (makeName || make).toString())
    .ilike('model', (modelName || model).toString())
    .order('created_at', { ascending: false })
    .limit(24)

  const makeLabel = makeName || toTitleCase(make)
  const modelLabel = modelName || toTitleCase(model)

  // JSON-LD structured data
  const itemList = (listings || []).map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/listings/${item.id}`,
    item: {
      '@type': 'Car',
      brand: item.make,
      model: item.model,
      vehicleModelDate: item.year?.toString(),
      mileageFromOdometer: item.mileage
        ? { '@type': 'QuantitativeValue', value: item.mileage, unitCode: 'KMT' }
        : undefined,
      offers: {
        '@type': 'Offer',
        price: item.price?.toString(),
        priceCurrency: 'LKR',
        availability: 'https://schema.org/InStock',
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/listings/${item.id}`
      }
    }
  }))

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/` },
      { '@type': 'ListItem', position: 2, name: 'Cars', item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/listings` },
      { '@type': 'ListItem', position: 3, name: makeLabel, item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/lk/cars/${make}` },
      { '@type': 'ListItem', position: 4, name: modelLabel, item: `${process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'}/lk/cars/${make}/${model}` },
    ]
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${makeLabel} ${modelLabel} for sale in Sri Lanka`,
    itemListElement: itemList
  }

  const resultsCount = listings?.length || 0

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {makeLabel} {modelLabel} for sale in Sri Lanka
          </h1>
          <p className="mt-2 text-gray-600">
            Browse active {makeLabel} {modelLabel} listings available across Sri Lanka. Showing {resultsCount} result{resultsCount === 1 ? '' : 's'}.
          </p>
          <div className="mt-3 text-sm">
            <Link href={`/listings?q=${encodeURIComponent(makeLabel + ' ' + modelLabel)}&intent=refine`} className="text-blue-600 hover:underline">Refine this search on the full browse page</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(listings && listings.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`} className="block group border rounded-lg overflow-hidden hover:shadow-lg transition">
                <div className="h-44 bg-gray-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url || item.image_urls?.[0] || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">{item.title}</h2>
                  <div className="mt-1 text-blue-700 font-bold">Rs. {item.price?.toLocaleString()}</div>
                  <div className="mt-1 text-sm text-gray-600 flex gap-2 flex-wrap">
                    {item.year ? <span>{item.year}</span> : null}
                    {item.mileage ? <span>{item.mileage.toLocaleString()} km</span> : null}
                    {item.fuel_type ? <span>{item.fuel_type}</span> : null}
                    {item.location ? <span>• {item.location}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-900">
            No current listings found for {makeLabel} {modelLabel}. Try broadening your search or check back soon.
          </div>
        )}

        <div className="mt-8 text-sm text-gray-600">
          Looking for other {makeLabel} models?{' '}
          <Link href={`/lk/cars/${encodeURIComponent(make)}`} className="text-blue-600 hover:underline">Browse all {makeLabel} in Sri Lanka</Link>.
        </div>
      </div>
    </div>
  )
}

import { Metadata } from 'next'
import Link from 'next/link'
import { VEHICLE_DATA } from '@/lib/constants/vehicleData'

type PageParams = { params: { make: string } }

function toTitleCase(str: string) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
  const { make } = params
  const category = VEHICLE_DATA.categories['car']
  const makeObj = category?.makes.find(m => m.id.toLowerCase() === make.toLowerCase() || m.name.toLowerCase() === make.toLowerCase())
  const makeLabel = makeObj?.name || toTitleCase(make)

  const title = `${makeLabel} Cars for Sale in Sri Lanka | VERA`
  const description = `Discover ${makeLabel} cars available in Sri Lanka. Explore models, prices, and contact sellers directly on VERA.`
  const canonical = `${baseUrl}/lk/cars/${encodeURIComponent(make)}`

  return {
    title,
    description,
    alternates: { canonical, languages: { 'en-LK': canonical, 'x-default': canonical } },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: canonical, type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default function MakeIndexPage({ params }: PageParams) {
  const { make } = params
  const category = VEHICLE_DATA.categories['car']
  const makeObj = category?.makes.find(m => m.id.toLowerCase() === make.toLowerCase() || m.name.toLowerCase() === make.toLowerCase())
  const makeLabel = makeObj?.name || toTitleCase(make)

  const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const models = makeObj?.models || []

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: (process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk') + '/' },
              { '@type': 'ListItem', position: 2, name: 'Cars', item: (process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk') + '/listings' },
              { '@type': 'ListItem', position: 3, name: makeLabel, item: (process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk') + '/lk/cars/' + encodeURIComponent(make) },
            ]
          })
        }}
      />
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{makeLabel} cars for sale in Sri Lanka</h1>
          <p className="mt-2 text-gray-600">Choose a model to see current listings available across Sri Lanka.</p>
          <div className="mt-3 text-sm">
            <Link href="/listings" className="text-blue-600 hover:underline">Browse all listings</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {models.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {models.sort().map((model) => (
              <Link key={model} href={`/lk/cars/${encodeURIComponent(make)}/${slugify(model)}`} className="block border rounded-md px-3 py-2 text-sm text-gray-800 hover:border-blue-400 hover:text-blue-700">
                {model}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-900">
            No models found for {makeLabel}.
          </div>
        )}
      </div>
    </div>
  )
}

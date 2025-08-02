import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60 // Refresh every minute

export default async function HomePage() {
  // Get featured listings
  const { data: featuredListings } = await supabase
    .from('listings')
    .select('*')
    .eq('is_featured', true)
    .eq('is_sold', false)
    .limit(3)
    .order('created_at', { ascending: false })

  // Get recent listings
  const { data: recentListings } = await supabase
    .from('listings')
    .select('*')
    .eq('is_sold', false)
    .limit(6)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Find Your Perfect Vehicle in Sri Lanka
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            Buy and sell vehicles with confidence. AI-powered descriptions make listing easy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Browse All Vehicles
            </Link>
            <Link href="/post" className="btn-primary bg-blue-900 hover:bg-blue-950">
              Sell Your Vehicle
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-gray-600">Daily Visitors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">AI</div>
              <div className="text-gray-600">Powered Descriptions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600">Available Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8">Featured Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`} className="card overflow-hidden group">
                  <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                    {listing.image_url ? (
                      <img
                        src={listing.image_url}
                        alt={listing.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600">{listing.title}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      Rs. {listing.price.toLocaleString()}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">
                      {listing.year} • {listing.mileage?.toLocaleString()} km • {listing.fuel_type}
                    </p>
                    <p className="text-gray-600 text-sm">📍 {listing.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Recent Listings</h2>
            <Link href="/listings" className="text-blue-600 hover:text-blue-700 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentListings?.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="card overflow-hidden group">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{listing.title}</h3>
                  <p className="text-xl font-bold text-blue-600">
                    Rs. {listing.price.toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {listing.location} • {listing.year}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Post a wanted request and let sellers come to you
          </p>
          <Link href="/wanted/post" className="btn-primary bg-white text-blue-900 hover:bg-gray-100">
            Post Wanted Request
          </Link>
        </div>
      </section>
    </div>
  )
}
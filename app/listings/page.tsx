import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

export default async function ListingsPage() {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('is_sold', false)
    .order('created_at', { ascending: false })

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">All Vehicles</h1>
          <Link href="/post" className="btn-primary">
            Sell Your Vehicle
          </Link>
        </div>

        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
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
                <div className="p-4">
                  <h3 className="font-semibold mb-2 group-hover:text-blue-600">{listing.title}</h3>
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    Rs. {listing.price.toLocaleString()}
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{listing.year} • {listing.mileage?.toLocaleString()} km</p>
                    <p>{listing.fuel_type} • {listing.transmission}</p>
                    <p>📍 {listing.location}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No vehicles listed yet.</p>
            <Link href="/post" className="btn-primary mt-4 inline-block">
              Be the first to list a vehicle
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

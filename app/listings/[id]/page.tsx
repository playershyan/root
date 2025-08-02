import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!listing) {
    notFound()
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link href="/listings" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
          ← Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div>
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-lg">No image available</span>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>
            
            <p className="text-4xl font-bold text-blue-600 mb-6">
              Rs. {listing.price.toLocaleString()}
            </p>

            {/* Key Details */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Vehicle Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Make</p>
                  <p className="font-semibold">{listing.make}</p>
                </div>
                <div>
                  <p className="text-gray-600">Model</p>
                  <p className="font-semibold">{listing.model}</p>
                </div>
                <div>
                  <p className="text-gray-600">Year</p>
                  <p className="font-semibold">{listing.year}</p>
                </div>
                <div>
                  <p className="text-gray-600">Mileage</p>
                  <p className="font-semibold">{listing.mileage?.toLocaleString() || 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-gray-600">Fuel Type</p>
                  <p className="font-semibold">{listing.fuel_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transmission</p>
                  <p className="font-semibold">{listing.transmission || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {listing.description || listing.ai_generated_description || 'No description available.'}
              </p>
            </div>

            {/* AI Summary if available */}
            {listing.ai_summary && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">AI Summary:</span> {listing.ai_summary}
                </p>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-gray-900 text-white p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Contact Seller</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400">Location</p>
                  <p className="font-semibold">{listing.location}</p>
                </div>
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="font-semibold text-lg">{listing.phone}</p>
                </div>
                <div className="pt-4">
                  <a 
                    href={`tel:${listing.phone}`}
                    className="btn-primary bg-blue-600 hover:bg-blue-700 block text-center"
                  >
                    Call Seller
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Listed on {new Date(listing.created_at).toLocaleDateString()}</p>
          <p className="mt-2">⚠️ Always verify vehicle documents before purchase</p>
        </div>
      </div>
    </div>
  )
}

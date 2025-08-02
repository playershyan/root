import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 60

export default async function WantedRequestsPage() {
  const { data: requests } = await supabase
    .from('wanted_requests')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Wanted Requests</h1>
          <Link href="/wanted/post" className="btn-primary">
            Post Wanted Request
          </Link>
        </div>

        <p className="text-gray-600 mb-8">
          Buyers are looking for these vehicles. If you have a matching vehicle, contact them directly!
        </p>

        {requests && requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((request) => (
              <div key={request.id} className="card p-6">
                <h3 className="font-semibold text-lg mb-2">{request.title}</h3>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-blue-600">
                    Budget: Rs. {request.min_budget?.toLocaleString() || '0'} - {request.max_budget?.toLocaleString() || 'Any'}
                  </p>
                </div>

                {request.description && (
                  <p className="text-gray-700 mb-4">{request.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  {request.make && (
                    <div>
                      <span className="text-gray-600">Make:</span>
                      <span className="ml-2 font-medium">{request.make}</span>
                    </div>
                  )}
                  {request.model && (
                    <div>
                      <span className="text-gray-600">Model:</span>
                      <span className="ml-2 font-medium">{request.model}</span>
                    </div>
                  )}
                  {(request.min_year || request.max_year) && (
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <span className="ml-2 font-medium">
                        {request.min_year || 'Any'} - {request.max_year || 'Any'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{request.location}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Contact buyer:</p>
                  <a 
                    href={`tel:${request.phone}`}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    📞 {request.phone}
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No wanted requests yet.</p>
            <Link href="/wanted/post" className="btn-primary mt-4 inline-block">
              Post the first wanted request
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
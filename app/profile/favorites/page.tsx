import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, Heart, Camera, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getFavorites } from './utils/getFavorites'
import FavoritesLoadMoreButton from './components/FavoritesLoadMoreButton'
import { Button } from '@/components/ui/button'

// Enable ISR with 30-second revalidation
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function FavoritesPage({ searchParams }: PageProps) {
  // Get authenticated user
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Parse URL parameters
  const params = await searchParams
  const currentPage = parseInt(params.page || '1')

  // Fetch favorites (server-side, paginated)
  const { favorites, totalCount, hasMore } = await getFavorites(
    user.id,
    currentPage,
    20
  )

  // Separate listings and wanted requests
  const favoriteListings = favorites.filter(f => f.item_type === 'listing' && f.listing)
  const favoriteWantedRequests = favorites.filter(f => f.item_type === 'wanted_request' && f.wanted_request)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/profile">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Button>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-2xl font-semibold">Favorites</h1>
            <p className="text-gray-600 mt-2">
              {totalCount} favorite{totalCount !== 1 ? 's' : ''} saved
            </p>
          </div>

          <div className="p-6">
            {favorites.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">No favorites yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Save listings and wanted requests to find them easily later
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    asChild
                    variant="primary"
                    size="default"
                  >
                    <Link href="/">
                      Browse Listings
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="default"
                  >
                    <Link href="/wanted">
                      Browse Wanted Requests
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Favorite Listings */}
                {favoriteListings.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      Saved Listings ({favoriteListings.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteListings.map((fav) => {
                        const listing = fav.listing!
                        const imageUrl = listing.primary_image_url || listing.image_url || listing.image_urls?.[0]
                        
                        return (
                          <Link
                            key={fav.id}
                            href={`/listings/${listing.id}`}
                            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                          >
                            <div className="aspect-video bg-gray-200 flex items-center justify-center overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                                {listing.title}
                              </h3>
                              <p className="text-lg font-bold text-blue-600 mb-2">
                                Rs. {listing.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {listing.location}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Favorite Wanted Requests */}
                {favoriteWantedRequests.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      Saved Wanted Requests ({favoriteWantedRequests.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favoriteWantedRequests.map((fav) => {
                        const wanted = fav.wanted_request!
                        const budget = wanted.max_budget || wanted.min_budget || 0
                        
                        return (
                          <Link
                            key={fav.id}
                            href={`/wanted/${wanted.id}`}
                            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
                          >
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                              {wanted.title}
                            </h3>
                            <p className="text-lg font-bold text-green-600 mb-2">
                              Budget: Rs. {budget.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {wanted.location}
                            </p>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Load More Button */}
                <FavoritesLoadMoreButton 
                  currentPage={currentPage}
                  hasMore={hasMore}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

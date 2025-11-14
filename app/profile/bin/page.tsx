import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ArrowLeft, Trash2, Camera, MapPin, Car, Search } from 'lucide-react'
import Link from 'next/link'
import { getBinItems } from './utils/getBinItems'
import BinLoadMoreButton from './components/BinLoadMoreButton'
import { Button } from '@/components/ui/button'

// Enable ISR with 30-second revalidation
export const revalidate = 30

// Helper to format date
function formatDeletedDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

interface PageProps {
  searchParams: Promise<{
    page?: string
  }>
}

export default async function BinPage({ searchParams }: PageProps) {
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

  // Fetch bin items (server-side, paginated)
  const { items, totalCount, hasMore } = await getBinItems(
    user.id,
    currentPage,
    20
  )

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
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-6 h-6 text-gray-400" />
              <h1 className="text-2xl font-semibold">Bin</h1>
            </div>
            <p className="text-gray-600">
              {totalCount} deleted item{totalCount !== 1 ? 's' : ''} • Items are permanently deleted after 30 days
            </p>
          </div>

          <div className="p-6">
            {items.length === 0 ? (
              /* Empty State */
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-900 mb-1">Bin is empty</p>
                <p className="text-sm text-gray-600">
                  Deleted items will appear here for 30 days
                </p>
              </div>
            ) : (
              <>
                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border rounded-lg shadow-sm p-4 relative"
                    >
                      {/* Item Type Badge */}
                      <div className="absolute top-2 right-2">
                        {item.item_type === 'listing' ? (
                          <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            Listing
                          </div>
                        ) : (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                            <Search className="w-3 h-3" />
                            Wanted
                          </div>
                        )}
                      </div>

                      {/* Image (for listings) */}
                      {item.item_type === 'listing' && (
                        <div className="aspect-video bg-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover opacity-75"
                            />
                          ) : (
                            <Camera className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 line-clamp-2">
                          {item.title}
                        </h3>
                        
                        {item.price && (
                          <p className="text-lg font-bold text-gray-700">
                            Rs. {item.price.toLocaleString()}
                          </p>
                        )}

                        {item.location && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {item.location}
                          </p>
                        )}

                        <p className="text-xs text-gray-500">
                          Deleted {formatDeletedDate(item.deleted_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          disabled
                        >
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled
                        >
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                <BinLoadMoreButton 
                  currentPage={currentPage}
                  hasMore={hasMore}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

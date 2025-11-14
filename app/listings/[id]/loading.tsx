export default function ListingDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb Skeleton */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="text-gray-400">/</div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="text-gray-400">/</div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Skeleton */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              </div>
              {/* Thumbnail dots */}
              <div className="p-4 flex gap-2 justify-center">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                ))}
              </div>
            </div>

            {/* Details Section Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Specifications Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Price Card Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Seller Info Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Similar Listings Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


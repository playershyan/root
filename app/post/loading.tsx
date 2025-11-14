export default function PostListingLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
        </div>

        {/* Form Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Image Upload Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Form Fields Skeleton */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}

          {/* Submit Button Skeleton */}
          <div className="pt-4">
            <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}


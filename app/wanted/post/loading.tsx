export default function PostWantedLoading() {
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
          {/* Form Fields Skeleton */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              {i === 3 ? (
                <div className="h-32 w-full bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              )}
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


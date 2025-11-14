export default function WantedPaymentLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Payment Form Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Payment Options */}
          <div className="space-y-4">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg border-2 border-gray-200 animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4 pt-6 border-t">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Submit Button Skeleton */}
          <div className="pt-4">
            <div className="h-12 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function ProfileSecurityLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Security Settings Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Security Sections */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4 pb-6 border-b last:border-0">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


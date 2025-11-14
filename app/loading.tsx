export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <section className="relative bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Animated heading skeleton */}
          <div className="h-12 md:h-16 bg-gray-200 rounded-lg max-w-2xl mx-auto mb-6 animate-pulse" />
          
          {/* Subheading skeleton */}
          <div className="h-6 bg-gray-200 rounded-lg max-w-xl mx-auto mb-8 animate-pulse" />
          
          {/* Search bar skeleton */}
          <div className="h-14 bg-gray-200 rounded-full max-w-2xl mx-auto mb-10 animate-pulse" />
          
          {/* Quick filters skeleton */}
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>

          {/* Browse button skeleton */}
          <div className="h-12 w-48 bg-blue-200 rounded-lg mx-auto animate-pulse" />
        </div>
      </section>
      
      {/* Featured listings skeleton */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section title skeleton */}
          <div className="h-8 w-48 bg-gray-300 rounded-lg mb-8 animate-pulse" />
          
          {/* Listings grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Image skeleton */}
                <div className="h-48 bg-gray-300 animate-pulse" />
                
                {/* Content skeleton */}
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                  <div className="h-8 bg-blue-200 rounded animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Benefits Section Skeleton */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section title skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 w-80 bg-gray-200 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-6 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse" />
          </div>

          {/* Benefits Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary CTA Skeleton */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-10 w-96 bg-gray-200 rounded-lg mx-auto animate-pulse" />
            <div className="h-6 w-80 bg-gray-200 rounded-lg mx-auto animate-pulse" />
            <div className="h-12 w-56 bg-gray-200 rounded-lg mx-auto animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  )
}


import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Auto Dealers Directory | AutoTrader.lk',
  description: 'Browse verified auto dealers in Sri Lanka. Find trusted car dealerships with ratings, reviews, and current inventory.',
}

export default function DealersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Dealers</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto Dealers Directory</h1>
          <p className="text-gray-600">Find trusted car dealerships across Sri Lanka</p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dealers Directory Coming Soon</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We're building a comprehensive directory of verified auto dealers. 
              Soon you'll be able to browse, compare, and contact dealers directly.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Coming Features:</h3>
              <ul className="text-left text-blue-700 text-sm space-y-1">
                <li>• Verified dealer profiles</li>
                <li>• Customer reviews and ratings</li>
                <li>• Dealer specializations</li>
                <li>• Location-based search</li>
                <li>• Direct contact options</li>
                <li>• Current inventory listings</li>
              </ul>
            </div>

            <Link 
              href="/listings" 
              className="btn-primary px-6 py-2 rounded-lg"
            >
              Browse Vehicle Listings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
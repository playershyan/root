import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sitemap - VERA',
  description: 'Complete site navigation and directory of all pages on VERA - Sri Lanka\'s smartest vehicle marketplace.',
}

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black mb-2">Sitemap</h1>
            <p className="text-gray-600">Complete site directory for VERA</p>
          </div>
        </div>
      </div>

      {/* File Tree */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-50 rounded-lg p-8 font-mono text-sm">
          <div className="space-y-1">
            <div className="text-gray-900 font-semibold">vera.lk/</div>
            <div className="ml-4">
              <div>├── <Link href="/" className="text-blue-600 hover:underline">Home</Link></div>
            </div>
            
            {/* Buy & Browse */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Buy & Browse</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/listings" className="text-blue-600 hover:underline">Browse All Listings</Link></div>
                <div>├── <Link href="/wanted" className="text-blue-600 hover:underline">Wanted Requests</Link></div>
                <div>└── <Link href="/dealers" className="text-blue-600 hover:underline">Verified Dealers</Link></div>
              </div>
            </div>

            {/* Sell & Post */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Sell & Post</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/post" className="text-blue-600 hover:underline">Sell Your Vehicle</Link></div>
                <div>├── <Link href="/wanted/post" className="text-blue-600 hover:underline">Post Wanted Request</Link></div>
                <div>└── Promotion Options</div>
                <div className="ml-4 space-y-1">
                    <div>├── <Link href="/post/boost" className="text-blue-600 hover:underline">Boost Your Listing</Link></div>
                    <div>├── <Link href="/post/paid-features" className="text-blue-600 hover:underline">Paid Features</Link></div>
                    <div>├── <Link href="/wanted/post/boost" className="text-blue-600 hover:underline">Boost Wanted Request</Link></div>
                    <div>└── <Link href="/wanted-request/paid-features" className="text-blue-600 hover:underline">Wanted Paid Features</Link></div>
                </div>
              </div>
            </div>

            {/* Features & Technology */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Features & Technology</div>
              <div className="ml-4 space-y-1">
                <div>└── <Link href="/ai-features" className="text-blue-600 hover:underline">AI-Powered Features</Link></div>
              </div>
            </div>

            {/* User Account */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── User Account</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/register" className="text-blue-600 hover:underline">Create Account</Link></div>
                <div>├── <Link href="/login" className="text-blue-600 hover:underline">Sign In</Link></div>
                <div>├── <Link href="/profile" className="text-blue-600 hover:underline">My Profile</Link> <span className="text-gray-500 text-xs">(requires login)</span></div>
                <div>└── <Link href="/forgot-password" className="text-blue-600 hover:underline">Forgot Password</Link></div>
              </div>
            </div>

            {/* Safety & Support */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Safety & Support</div>
              <div className="ml-4 space-y-1">
                <div>└── <Link href="/safety" className="text-blue-600 hover:underline">Safety & Fraud Detection</Link></div>
              </div>
            </div>

            {/* Company */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Company</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/about" className="text-blue-600 hover:underline">About Us</Link></div>
                <div>└── <Link href="/careers" className="text-blue-600 hover:underline">Careers</Link></div>
              </div>
            </div>

            {/* Legal */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">├── Legal</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link></div>
                <div>└── <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link></div>
              </div>
            </div>

            {/* Site Information */}
            <div className="ml-4">
              <div className="text-gray-700 font-medium mb-1">└── Site Information</div>
              <div className="ml-4 space-y-1">
                <div>├── <Link href="/sitemap" className="text-blue-600 hover:underline">HTML Sitemap</Link> <span className="text-gray-500 text-xs">(this page)</span></div>
                <div>├── <Link href="/sitemap.xml" className="text-blue-600 hover:underline" target="_blank">XML Sitemap</Link> <span className="text-gray-500 text-xs">(for search engines)</span></div>
                <div>└── <Link href="/robots.txt" className="text-blue-600 hover:underline" target="_blank">Robots.txt</Link> <span className="text-gray-500 text-xs">(crawler instructions)</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* Additional Notes */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Notes:</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Dynamic pages (listings/{'{id}'}, dealers/{'{name}'}, etc.) are not shown individually</li>
            <li>• Admin pages require special access and are not publicly listed</li>
            <li>• Some features may require user authentication</li>
            <li>• This sitemap is updated regularly to reflect site changes</li>
          </ul>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">← Back to Home</Link>
            <span className="mx-3 text-gray-400">|</span>
            <Link href="/listings" className="text-blue-600 hover:underline">Browse Listings</Link>
            <span className="mx-3 text-gray-400">|</span>
            <Link href="/post" className="text-blue-600 hover:underline">Sell Your Vehicle</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
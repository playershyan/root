import Link from 'next/link'
import dynamicImport from 'next/dynamic'

const AboutSection = dynamicImport(() => import('./components/AboutSection'), {
  ssr: false
})

const GoogleOneTap = dynamicImport(() => import('./components/GoogleOneTap'), {
  ssr: false
})

const EmailVerificationAlert = dynamicImport(() => import('./components/EmailVerificationAlert'), {
  ssr: false
})

import FeaturedListingsSSR from './components/homepage/FeaturedListingsSSR'
import AnimatedHeroHeading from './components/hero/AnimatedHeroHeading'

export const revalidate = 60 // Refresh every minute
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div>
      <GoogleOneTap />
      <EmailVerificationAlert />

      {/* Hero Section - Minimal Design */}
      <section className="relative bg-white text-gray-900 py-24 md:py-32 overflow-hidden">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(37,99,235,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedHeroHeading />
          <p className="text-lg md:text-xl mb-8 text-gray-600 max-w-3xl mx-auto">
            Sri Lanka's first intelligent car buying platform. Let AI find your perfect match, generate descriptions, and ensure fair pricing.
          </p>

          {/* AI Features Badges */}
          <div className="flex flex-wrap gap-4 justify-center mb-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Smart Matching
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              AI Descriptions
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fair Pricing
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-sm font-medium text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Auto Verification
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings" className="inline-flex items-center justify-center px-8 py-3 border-2 border-blue-600 text-blue-600 bg-white rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Browse AI-Matched Vehicles
            </Link>
            <Link href="/post" className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Sell with AI Help
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <FeaturedListingsSSR displayCount={3} />

      {/* Trust & Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of vehicle trading with intelligent automation
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-base font-medium text-gray-900 mb-3">AI-Enhanced Listings</div>
              <div className="text-sm text-gray-500">Smart descriptions generated automatically</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-base font-medium text-gray-900 mb-3">Daily AI Matches</div>
              <div className="text-sm text-gray-500">Perfect buyer-seller connections</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">AI</div>
              <div className="text-base font-medium text-gray-900 mb-3">Price Intelligence</div>
              <div className="text-sm text-gray-500">Fair market value analysis</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-base font-medium text-gray-900 mb-3">AI Monitoring</div>
              <div className="text-sm text-gray-500">Continuous fraud detection</div>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Matching</h4>
                <p className="text-sm text-gray-600">Our intelligent algorithm connects buyers with their perfect vehicle based on preferences, budget, and location</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Smart Descriptions</h4>
                <p className="text-sm text-gray-600">AI generates compelling, accurate vehicle descriptions automatically, saving time and improving listing quality</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Fair Pricing Intelligence</h4>
                <p className="text-sm text-gray-600">Get real-time market analysis and pricing suggestions to ensure fair deals for both buyers and sellers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Can't Find Your Perfect Vehicle?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Post a wanted request and let sellers come to you with their best offers
            </p>
            <Link href="/wanted/post" className="inline-block px-6 py-3 border border-gray-300 text-gray-600 bg-white rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors">
              Post Wanted Request
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <AboutSection />
    </div>
  )
}
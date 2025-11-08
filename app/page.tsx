import Link from 'next/link'
import dynamicImport from 'next/dynamic'
import AboutSection from './components/AboutSection'

const GoogleOneTap = dynamicImport(() => import('./components/GoogleOneTap'), {
  ssr: false
})

const EmailVerificationAlert = dynamicImport(() => import('./components/EmailVerificationAlert'), {
  ssr: false
})

import FeaturedListingsSSR from './components/homepage/FeaturedListingsSSR'
import AnimatedHeroHeading from './components/hero/AnimatedHeroHeading'
import HeroSearchBar from './components/hero/HeroSearchBar'
import HeroFiltersSection from './components/hero/HeroFiltersSection'

export const revalidate = 60 // Refresh every minute
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div>
      <GoogleOneTap />
      <EmailVerificationAlert />

      {/* Hero Section - Mobile Optimized */}
      <section className="relative bg-white text-gray-900 py-16 md:py-24">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(37,99,235,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedHeroHeading />
          <p className="text-base md:text-xl mb-6 md:mb-8 text-gray-600 max-w-3xl mx-auto">
            Sri Lanka's verified marketplace - where trusted listings meet intelligent matching
          </p>

          {/* Search Bar - PRIMARY ACTION */}
          <div className="mb-8 md:mb-10">
            <HeroSearchBar />
          </div>

          {/* Quick Filters + Browse Button */}
          <HeroFiltersSection />
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
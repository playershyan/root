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

export const revalidate = 60 // Revalidate every minute (ISR)

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
      <FeaturedListingsSSR displayCount={10} />

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
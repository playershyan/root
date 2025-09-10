import Link from 'next/link'
import { Sparkles, BookOpen, PenTool, Rocket, Zap, Brain, TrendingUp, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Features - VERA.lk',
  description: 'Discover the intelligent features that make VERA.lk the smartest vehicle marketplace in Sri Lanka. Get AI-powered buying guides and intelligent listing descriptions.',
}

export default function AIFeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-30"></div>
        <div className="absolute inset-0">
          <div className="h-full w-full bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-6 sm:mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              AI Features
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light">
              The future of vehicle trading is here. And it's brilliant.
            </p>
          </div>
        </div>
      </div>

      {/* We're Changing Everything Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            We're Changing Everything
          </h2>
          <div className="space-y-4 sm:space-y-6 text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed">
            <p>
              Vehicle marketplaces have been stuck in 2010. Basic search, boring listings, zero intelligence.
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              We built something completely different.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Smart Buying Guides */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Smart Buying Guides</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Get instant expert advice for any vehicle. No more guessing, no more research rabbit holes. 
                Just smart guidance tailored to Sri Lanka's roads and market.
              </p>
              <div className="mt-4 sm:mt-6 flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                <span className="font-semibold text-sm sm:text-base">Experience it now</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Intelligent Descriptions */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <PenTool className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Intelligent Descriptions</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                Turn basic details into compelling listings in seconds. Choose your style – professional, 
                personal, detailed, or urgent. Our AI handles the writing, you handle the selling.
              </p>
              <div className="mt-4 sm:mt-6 flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="font-semibold text-sm sm:text-base">Try it out</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Just The Beginning */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-6 sm:mb-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
              <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6">Just The Beginning</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-6 sm:mb-8">
              More AI features are coming to help buyers, sellers, and dealers make smarter decisions. 
              Our mission? Make Sri Lanka's vehicle market more efficient, transparent, and competitive.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400">
              <div className="flex items-center">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-400" />
                <span className="text-sm sm:text-base">Smart Pricing</span>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-400" />
                <span className="text-sm sm:text-base">Market Insights</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-yellow-400" />
                <span className="text-sm sm:text-base">Instant Matching</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manifesto Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12 leading-relaxed">
            This is what happens when you stop accepting{' '}
            <span className="text-gray-500 line-through">"good enough"</span>{' '}
            and start demanding{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              brilliant
            </span>.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8">Ready?</h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12">
            The smartest vehicle marketplace in Sri Lanka is live right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/listings" 
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Browse with AI
            </Link>
            <Link 
              href="/post" 
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300"
            >
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Sell with AI
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 italic">
            Intelligence built for Sri Lankan roads, Sri Lankan buyers, Sri Lankan sellers.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
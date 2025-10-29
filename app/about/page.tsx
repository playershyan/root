import Link from 'next/link'
import { Heart, Target, Zap, Shield, Sparkles, Brain, TrendingUp, Users, ArrowRight, Rocket, Globe } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us - VERA',
  description: 'Learn about VERA (Verified Exchange & Resource Assistant) - the intelligent platform transforming how Sri Lankans buy and sell vehicles, properties, and more. Verified listings powered by AI.',
}

export default function AboutPage() {
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
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              About VERA
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mb-3 font-medium">
              Verified Exchange & Resource Assistant
            </p>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
              We're redefining marketplace trading in Sri Lanka with verified listings, intelligent matching, and transparent pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            We're Redefining Vehicle Trading in Sri Lanka
          </h2>
          <div className="space-y-4 sm:space-y-6 text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed">
            <p>
              VERA (Verified Exchange & Resource Assistant) is more than just another marketplace – we're the intelligent platform transforming how Sri Lankans buy and sell vehicles, properties, tech items, and more. Built with cutting-edge technology and deep market understanding, we're making trading effortless, transparent, and fair for everyone through verified listings you can trust.
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              We believe Sri Lanka's vehicle market deserves better.
            </p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-6 sm:mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6">Our Mission</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed mb-6 sm:mb-8">
              Our mission is simple: make the vehicle buying and selling industry more <strong className="text-blue-400">efficient</strong>, <strong className="text-purple-400">transparent</strong>, and <strong className="text-pink-400">competitive</strong>.
            </p>
            <p className="text-lg sm:text-xl text-gray-400">
              For too long, vehicle trading has been complicated, uncertain, and time-consuming. We're changing that by bringing artificial intelligence, smart features, and user-focused design to create the marketplace Sri Lanka needs.
            </p>
          </div>
        </div>
      </div>

      {/* What Makes Us Different */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8 sm:mb-12 text-center">
          What Makes VERA Different
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Intelligence First */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/50 to-purple-900/50 p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Intelligence First</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                While others stick to basic listings, we've built an AI-powered platform that actually understands what buyers and sellers need. From smart buying guides to intelligent description generation, every feature is designed to make better decisions easier.
              </p>
            </div>
          </div>

          {/* Transparency by Design */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Transparency by Design</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                No hidden fees, no confusing processes, no uncertainty. We believe transparency builds trust, and trust builds better transactions. Every aspect of our platform is designed to give users complete clarity and control.
              </p>
            </div>
          </div>

          {/* Built for Sri Lanka */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900/50 to-teal-900/50 p-6 sm:p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 mb-4 sm:mb-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
                <Globe className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Built for Sri Lanka</h3>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                We're not a copy of foreign platforms. VERA is built specifically for Sri Lankan roads, Sri Lankan buyers, and Sri Lankan sellers. From our AI training data to our user experience, everything reflects the unique needs of our market.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The VERA Advantage */}
      <div className="bg-gradient-to-r from-gray-900/50 to-black py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8 sm:mb-12 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            The VERA Advantage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4">For Buyers</h3>
              <p className="text-gray-300 leading-relaxed">
                Get instant expert guidance, avoid costly mistakes, and find your perfect vehicle faster with AI-powered recommendations and comprehensive buying guides.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4">For Sellers</h3>
              <p className="text-gray-300 leading-relaxed">
                Create compelling listings in seconds, reach serious buyers, and close deals faster with our intelligent description generator and advanced targeting features.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4">For Dealers</h3>
              <p className="text-gray-300 leading-relaxed">
                Scale your operations with professional-grade tools, manage large inventories effortlessly, and maintain consistent quality across all your listings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Our Technology */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 text-center">
            Our Technology
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 text-center">
            Behind VERA's simple interface lies sophisticated technology:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h4 className="font-bold text-white mb-2">AI-Powered Insights</h4>
                <p className="text-gray-400 text-sm">Machine learning algorithms trained on Sri Lankan market data provide personalized guidance and recommendations</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h4 className="font-bold text-white mb-2">Smart Matching</h4>
                <p className="text-gray-400 text-sm">Advanced algorithms connect the right buyers with the right vehicles</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5">
              <div className="w-2 h-2 bg-pink-500 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h4 className="font-bold text-white mb-2">Fraud Detection</h4>
                <p className="text-gray-400 text-sm">Automated systems monitor for suspicious activity and protect our community</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-3 flex-shrink-0"></div>
              <div>
                <h4 className="font-bold text-white mb-2">Real-Time Analytics</h4>
                <p className="text-gray-400 text-sm">Market intelligence that keeps pace with Sri Lanka's dynamic automotive landscape</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why We Started */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 mb-6 sm:mb-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl">
              <Rocket className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 sm:mb-6">Why We Started VERA</h2>
            <div className="space-y-4 sm:space-y-6 text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed">
              <p>
                We saw a vehicle marketplace stuck in the past while the world moved forward. Basic search functions, generic listings, and zero intelligence – that wasn't good enough for Sri Lanka's vibrant automotive community.
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                We knew we could build something better.
              </p>
              <p>
                A platform that uses technology not just for show, but to solve real problems. Where every search is smarter, every listing works harder, and every transaction builds trust.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vision for the Future */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Our Vision for the Future
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8">
            VERA is just the beginning. We're building a comprehensive ecosystem where:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10">
              <span className="text-center">Vehicle pricing is always fair and transparent</span>
            </div>
            <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-white/10">
              <span className="text-center">Buying decisions are backed by intelligent insights</span>
            </div>
            <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-white/10">
              <span className="text-center">Market trends are accessible to everyone</span>
            </div>
            <div className="flex items-center justify-center p-4 rounded-xl bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-white/10">
              <span className="text-center">Quality vehicles find quality buyers effortlessly</span>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-gray-400">
            We're not just changing how vehicles are traded – we're elevating the entire industry standard.
          </p>
        </div>
      </div>

      {/* Manifesto Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12 leading-relaxed">
            The future of vehicle trading is{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              intelligent
            </span>,{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              transparent
            </span>, and designed around{' '}
            <span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
              you
            </span>.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden py-12 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 sm:mb-8">Join the Revolution</h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Whether you're buying your first vehicle, selling a cherished car, or managing a dealership, VERA gives you the tools to succeed in Sri Lanka's evolving automotive market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/listings" 
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Browsing
            </Link>
            <Link 
              href="/post" 
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-base sm:text-lg hover:bg-white/20 transition-all duration-300"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              List Your Vehicle
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Quote */}
      <div className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xl sm:text-2xl font-bold mb-4">
            <strong className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to VERA – where smart meets simple.
            </strong>
          </p>
          <p className="text-gray-400 italic mb-6">
            Ready to experience the smartest vehicle marketplace in Sri Lanka? Your next great transaction starts here.
          </p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}
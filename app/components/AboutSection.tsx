'use client'

import { useState } from 'react'

export default function AboutSection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">About AutoTrader.lk</h2>
          
          <div className="prose prose-lg mx-auto text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              AutoTrader.lk is Sri Lanka's premier online vehicle marketplace, connecting buyers and sellers across the island. 
              Our platform makes it easy to find your dream vehicle or sell your current one with confidence.
            </p>
            
            <p className="text-lg leading-relaxed mb-4">
              With AI-powered listing descriptions and a user-friendly interface, we're revolutionizing the way 
              Sri Lankans buy and sell vehicles online. Our advanced features include instant vehicle valuation, 
              secure messaging, and comprehensive vehicle history reports.
            </p>

            <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
              <p className="text-lg leading-relaxed mb-4">
                Founded with a mission to simplify vehicle transactions, AutoTrader.lk brings transparency and trust 
                to the automotive marketplace. We verify all listings to ensure authenticity and provide detailed 
                information about each vehicle, including specifications, ownership history, and condition reports.
              </p>
              
              <p className="text-lg leading-relaxed mb-4">
                Our innovative wanted requests feature allows buyers to post their requirements and receive offers 
                from sellers directly, saving time and effort in finding the perfect match. Whether you're looking 
                for a family car, a commercial vehicle, or a luxury ride, AutoTrader.lk has you covered.
              </p>
              
              <p className="text-lg leading-relaxed">
                Join thousands of satisfied users who have successfully bought or sold their vehicles through our 
                platform. With 24/7 availability, secure transactions, and dedicated customer support, we're here 
                to make your vehicle trading experience seamless and enjoyable.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>{isExpanded ? 'See Less' : 'See More'}</span>
              <svg 
                className={`ml-2 w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
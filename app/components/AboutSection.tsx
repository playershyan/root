export default function AboutSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">About VERA</h2>
          
          <p className="text-sm md:text-base text-gray-500 mb-4 font-medium">
            Verified Exchange & Resource Assistant
          </p>

          <p className="text-lg leading-relaxed text-gray-600 mb-8">
            VERA (Verified Exchange & Resource Assistant) is Sri Lanka's first AI-powered marketplace, revolutionizing how people buy and sell vehicles, properties, tech items, and more.
            Our intelligent platform uses advanced machine learning to create perfect matches, generate compelling descriptions,
            and ensure fair pricing for everyone - all backed by verified listings you can trust.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-12">
            <div className="text-center p-2 md:p-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 text-blue-600">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">AI Matching</h4>
              <p className="text-xs md:text-sm text-gray-600">Intelligent buyer-seller connections</p>
            </div>
            <div className="text-center p-2 md:p-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 text-blue-600">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">Auto Descriptions</h4>
              <p className="text-xs md:text-sm text-gray-600">AI-generated listing content</p>
            </div>
            <div className="text-center p-2 md:p-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 text-blue-600">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">Smart Pricing</h4>
              <p className="text-xs md:text-sm text-gray-600">Real-time market analysis</p>
            </div>
            <div className="text-center p-2 md:p-4">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3 text-blue-600">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2">AI Security</h4>
              <p className="text-xs md:text-sm text-gray-600">Automated fraud detection</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
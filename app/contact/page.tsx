import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | VERA',
  description: 'Get in touch with VERA support team. We are here to help you with any questions or concerns.'
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions or need assistance? We're here to help.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Email</h3>
                <a
                  href="mailto:support@vera.lk"
                  className="text-lg text-blue-600 hover:text-blue-700 transition-colors font-medium"
                >
                  support@vera.lk
                </a>
                <p className="text-sm text-gray-600 mt-3">
                  We typically respond within 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Support Hours */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Support Hours</h3>
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">Monday - Sunday</p>
                  <p className="text-gray-700">9:00 AM - 9:00 PM</p>
                  <p className="text-sm text-gray-600 mt-3">
                    Sri Lanka Standard Time (UTC+5:30)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Location</h3>
              <p className="text-gray-700">Sri Lanka</p>
              <p className="text-sm text-gray-600 mt-2">
                Proudly serving customers nationwide
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Looking for quick answers?
          </h3>
          <p className="text-gray-600 mb-4">
            Check out our FAQ section for answers to common questions
          </p>
          <a
            href="/faq"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Visit FAQ
          </a>
        </div>
      </div>
    </div>
  )
}

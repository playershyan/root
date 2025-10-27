'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function FAQClient() {
  const faqs = [
    {
      question: "Are there any limits on the number of ads I can post?",
      answer: "There are currently no limits. You can post as many listings as you wish."
    },
    {
      question: "Are there any limits on the number of wanted requests I can post?",
      answer: "No. There will be no limits on the number of wanted requests — ever. You can post as many as you need."
    },
    {
      question: "How long will my ad or wanted request stay active?",
      answer: "Your ad or wanted request will remain active until you remove it or it is flagged for review due to a policy violation."
    },
    {
      question: "How do I edit or delete my ad or wanted request?",
      answer: "You can edit or delete your ad or request anytime from your account dashboard under \"My Listings\" or \"My Wanted Requests.\""
    },
    {
      question: "How can I feature or promote my ad or wanted request?",
      answer: "For ads, go to \"My Listings\" and select the option to boost your ad for greater visibility.\nFor wanted requests, the only promotional feature available is the \"High Priority\" option."
    },
    {
      question: "What type of vehicles can I list?",
      answer: "You can list any vehicle that meets our posting policies, including cars, motorcycles, vans, and trucks."
    },
    {
      question: "Is posting an ad free?",
      answer: "Yes. Posting an ad is currently free, but a monthly quota system may be introduced in the future."
    },
    {
      question: "How can I contact a seller or buyer?",
      answer: "Use the built-in chat or contact form on each ad page. Do not share personal or sensitive information outside the platform."
    },
    {
      question: "What should I do if I suspect a scam or fraudulent activity?",
      answer: "Report the ad immediately using the \"Report\" button. Our moderation team will review it and take appropriate action."
    },
    {
      question: "Can I access the website on mobile devices?",
      answer: "Yes. The website is fully optimised for both desktop and mobile use."
    },
    {
      question: "How do I create an account?",
      answer: "Click \"Sign Up\" at the top of the homepage and follow the on-screen instructions to register using your email or social account."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24 overflow-hidden">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI-Powered Support
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Get instant answers to common questions about VERA's AI-powered vehicle marketplace
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Common Questions
            </h2>
            <p className="text-lg text-gray-600">
              Find quick answers to help you get the most out of VERA
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
              </svg>
              AI Support Available
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Our AI-powered support system and human experts are here to help you 24/7
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </a>
              <a
                href="/safety"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Safety Guide
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">
          {question}
        </span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {answer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

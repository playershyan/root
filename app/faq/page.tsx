import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | VERA',
  description: 'Find answers to commonly asked questions about posting ads, wanted requests, promotions, and more on VERA.'
}

export default function FAQPage() {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Find answers to commonly asked questions about using VERA
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {index + 1}. {faq.question}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-4">
            Can't find the answer you're looking for? Please reach out to our support team.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

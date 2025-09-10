import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - VERA',
  description: 'Privacy Policy for VERA - Learn how we collect, use, and protect your information on Sri Lanka\'s smartest vehicle marketplace.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Privacy Policy</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: 10 September 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Account Information:</strong> username, email address, phone number, password.</li>
                <li><strong>Profile Information:</strong> optional details such as location and bio.</li>
                <li><strong>Listing Information:</strong> vehicle details, photographs, pricing, and descriptions.</li>
                <li><strong>Communication Data:</strong> messages exchanged between users.</li>
                <li><strong>Usage Information:</strong> log data, IP addresses, search queries, device data, browser information.</li>
                <li><strong>Verification Data:</strong> identity documents where required for fraud prevention or regulatory compliance.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Operating, maintaining, and improving the Platform.</li>
                <li>Processing listings and managing user accounts.</li>
                <li>Facilitating communication between buyers and sellers.</li>
                <li>Account verification, authentication, and security.</li>
                <li>Detecting and preventing fraud or illegal activities.</li>
                <li>Personalising experience and recommending listings.</li>
                <li>Sending service updates, legal notices, and security alerts.</li>
                <li>Complying with obligations imposed by the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Public Listings:</strong> all listing content is publicly visible.</li>
                <li><strong>User Communication:</strong> limited details may be disclosed between transacting users.</li>
                <li><strong>Service Providers:</strong> third parties assisting in hosting, analytics, or payments.</li>
                <li><strong>Legal Requirements:</strong> courts, regulators, or law enforcement of the <strong>Democratic Socialist Republic of Sri Lanka</strong>.</li>
                <li><strong>Business Transfers:</strong> transfer of data if ownership of the Platform changes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>SSL/TLS encryption.</li>
                <li>Restricted and authenticated access.</li>
                <li>Regular security audits.</li>
                <li>Secure hosting with reputable providers.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Rights</h2>
              <p className="text-gray-700 mb-4">
                Access, correction, deletion, portability, and restriction subject to the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>.
              </p>
              <p className="text-gray-700">
                Requests: <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                Cookies are used for authentication, analytics, and improving performance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Not responsible for external sites or integrations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                Data retained as long as necessary for business and legal compliance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-700 mb-4">
                Data may be processed outside the <strong>Democratic Socialist Republic of Sri Lanka</strong>, subject to safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy. Continued use means acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a><br />
                  We usually respond within 24-48 hours during business days.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
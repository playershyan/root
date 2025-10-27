import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - VERA',
  description: 'Privacy Policy for VERA - Learn how we collect, use, and protect your information on Sri Lanka\'s smartest vehicle marketplace.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Privacy Policy</span>
          </nav>
        </div>

        <div className="bg-white">
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
                <li><strong>Verification Data:</strong> identity documents when required for fraud prevention or regulatory compliance.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Operate, maintain, and improve the Platform</li>
                <li>Process listings and manage user accounts</li>
                <li>Facilitate communication between buyers and sellers</li>
                <li>Verify accounts, authenticate users, and ensure security</li>
                <li>Detect and prevent fraud or illegal activities</li>
                <li>Personalise user experience and recommend listings</li>
                <li>Send service updates, legal notices, and security alerts</li>
                <li>Comply with obligations under the laws of the Democratic Socialist Republic of Sri Lanka</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Public Listings:</strong> all listing content is publicly visible.</li>
                <li><strong>User Communication:</strong> limited details may be shared between transacting users.</li>
                <li><strong>Service Providers:</strong> third parties assisting with hosting, analytics, or payment processing.</li>
                <li><strong>Legal Requirements:</strong> disclosure to courts, regulators, or law enforcement as required by law.</li>
                <li><strong>Business Transfers:</strong> data may be transferred if ownership of the Platform changes.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>SSL/TLS encryption to protect data in transit</li>
                <li>Restricted and authenticated access to sensitive information</li>
                <li>Regular security audits</li>
                <li>Hosting with reputable, secure providers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Rights</h2>
              <p className="text-gray-700 mb-4">
                Users may request access, correction, deletion, portability, or restriction of their personal data, subject to applicable laws.
              </p>
              <p className="text-gray-700">
                Requests should be sent to <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                Cookies and similar technologies are used for authentication, analytics, and improving Platform performance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                VERA is not responsible for privacy practices or content on external sites or services integrated with the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                Data is retained only as long as necessary to operate the Platform and comply with legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. International Transfers</h2>
              <p className="text-gray-700 mb-4">
                User data may be processed outside the Democratic Socialist Republic of Sri Lanka, with safeguards to ensure adequate protection.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to this Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy at any time. Continued use of the Platform constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a><br />
                  Responses typically provided within 24–48 business hours.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
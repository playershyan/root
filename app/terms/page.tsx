import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions - VERA',
  description: 'Terms and Conditions for using VERA - Sri Lanka\'s smartest vehicle marketplace. Read our terms of service and user agreements.',
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Terms & Conditions</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">Last Updated: 10 September 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using the VERA platform ("Platform"), you agree to comply with and be bound by these Terms & Conditions ("Terms").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Services Provided</h2>
              <p className="text-gray-700 mb-4">VERA offers:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Vehicle listing and browsing</li>
                <li>User accounts and profiles</li>
                <li>Messaging tools between users</li>
                <li>Wanted requests</li>
                <li>AI-powered descriptions and analytics</li>
              </ul>
              <p className="text-gray-700">
                VERA is not a broker, dealer, or party to any transaction between users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Accounts</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide accurate and truthful registration information.</li>
                <li>Maintain the confidentiality and security of your account credentials.</li>
                <li>Operate only one account unless expressly authorised by VERA.</li>
                <li>Accept responsibility for all activity conducted through your account.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Listing Rules</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide accurate and truthful vehicle details.</li>
                <li>Upload genuine photographs only.</li>
                <li>Ensure you have legal authority to sell listed vehicles.</li>
                <li>Update or remove listings once sold.</li>
                <li>Avoid duplicate listings or spam content.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
              <p className="text-gray-700 mb-4">You must not:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Engage in fraud, misrepresentation, or illegal activities</li>
                <li>Sell stolen vehicles or items</li>
                <li>Participate in money laundering</li>
                <li>Harass, spam, or threaten other users</li>
                <li>Use bots, scraping tools, or data harvesting techniques</li>
                <li>Violate intellectual property rights</li>
                <li>Impersonate other individuals or entities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Transactions</h2>
              <p className="text-gray-700 mb-4">
                All transactions occur directly between buyers and sellers. VERA does not verify the authenticity, ownership, or condition of listed vehicles. Users must exercise due diligence, including meeting in public, inspecting vehicles, verifying documents, and using secure payment methods.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Fees</h2>
              <p className="text-gray-700 mb-4">
                Premium services may require payment. All applicable fees are clearly displayed before purchase and are subject to change with prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>VERA owns all rights, title, and interest in the Platform's content and branding.</li>
                <li>Users retain ownership of content they create but grant VERA a licence to host, display, and distribute it as part of the Platform.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Use of the Platform is governed by VERA's <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                The Platform is provided "as is" and "as available." VERA makes no warranties regarding uninterrupted operation, accuracy, or security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                VERA's liability is limited to the total amount paid to VERA by you for services in the twelve (12) months preceding any claim. VERA is not liable for indirect, incidental, or consequential damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold VERA, its affiliates, and partners harmless from any claims, damages, or losses arising from your breach of these Terms or misuse of the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Termination</h2>
              <p className="text-gray-700 mb-4">
                VERA may suspend or terminate accounts immediately for violations of these Terms. Users may request account closure. Certain obligations, including indemnification and liability limitations, survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by and interpreted under the laws of the Democratic Socialist Republic of Sri Lanka. Disputes shall be subject exclusively to the courts of Colombo.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Changes</h2>
              <p className="text-gray-700 mb-4">
                VERA may revise these Terms at any time. Continued use of the Platform constitutes acceptance of the updated Terms.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
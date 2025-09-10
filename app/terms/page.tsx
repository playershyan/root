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
                By using the Platform, you consent to these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Services Provided</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Vehicle listing and browsing.</li>
                <li>User accounts and profiles.</li>
                <li>Messaging tools.</li>
                <li>Wanted requests.</li>
                <li>AI-powered descriptions and analytics.</li>
              </ul>
              <p className="text-gray-700">
                VERA is not a broker, dealer, or contracting party to user transactions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Accounts</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide truthful registration information.</li>
                <li>Maintain account security.</li>
                <li>Operate only one account unless authorised.</li>
                <li>Responsible for all activity on your account.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Listing Rules</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Accurate and truthful vehicle details.</li>
                <li>Genuine photographs only.</li>
                <li>Ensure legal authority to sell.</li>
                <li>Remove or update listings once sold.</li>
                <li>No duplicates or spam.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Fraud, misrepresentation, or illegal activity.</li>
                <li>Sale of stolen vehicles.</li>
                <li>Money laundering.</li>
                <li>Harassment or spamming.</li>
                <li>Data scraping, bots, or harvesting.</li>
                <li>Intellectual property violations.</li>
                <li>Impersonation of individuals or entities.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Transactions</h2>
              <p className="text-gray-700 mb-4">
                Transactions are exclusively between buyers and sellers. VERA does not verify authenticity, ownership, or condition. Users must conduct due diligence: meet in public, inspect vehicles, verify documentation, and use secure payment methods.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Fees</h2>
              <p className="text-gray-700 mb-4">
                Premium services may require payment. Fees are displayed before purchase and subject to modification with notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                VERA owns all rights in the Platform's content and branding. Users retain ownership of their content but grant VERA a licence to host and display it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Use is subject to the <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                Platform provided "as is." No warranty of uninterrupted operation, accuracy, or security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                VERA's liability is limited to the total amount you paid to VERA for services within the preceding twelve months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You indemnify VERA and its affiliates against claims arising from your breach of these Terms or misuse of the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Termination</h2>
              <p className="text-gray-700 mb-4">
                VERA may suspend or terminate accounts immediately for violations. Users may request account closure. Certain obligations survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by and construed in accordance with the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>. Jurisdiction lies exclusively with the courts of Colombo, <strong>Democratic Socialist Republic of Sri Lanka</strong>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Changes</h2>
              <p className="text-gray-700 mb-4">
                We may amend these Terms. Continued use constitutes acceptance.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
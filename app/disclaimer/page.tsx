import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer - VERA',
  description: 'Important disclaimers and limitations for VERA users - Please read our legal disclaimers regarding platform usage and liability.',
}

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Disclaimer</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Disclaimer</h1>
          <p className="text-gray-600 mb-8">Last Updated: 10 September 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Role</h2>
              <p className="text-gray-700 mb-4">
                VERA operates as a marketplace platform connecting buyers and sellers. We are not a party to any transaction and do not provide warranties about vehicle condition, ownership, or seller legitimacy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Responsibility</h2>
              <p className="text-gray-700 mb-4">
                Users must exercise due diligence: inspect vehicles, verify documentation, confirm seller identity, and use secure payment methods. All transaction risks rest with the parties involved.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                VERA's total liability is limited to the amount paid to VERA for services within the preceding twelve months. We are not liable for transaction disputes, fraud, or vehicle defects.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information Accuracy</h2>
              <p className="text-gray-700 mb-4">
                While we strive for accuracy, we cannot guarantee the completeness or reliability of user-generated content, including vehicle descriptions, photographs, and pricing information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Content</h2>
              <p className="text-gray-700 mb-4">
                The platform may contain links to external websites or services. VERA is not responsible for the content, privacy policies, or practices of third-party sites.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Compliance</h2>
              <p className="text-gray-700 mb-4">
                This disclaimer is governed by the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>. Users are responsible for compliance with applicable local laws and regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
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
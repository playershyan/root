import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund and Cancellation Policy - VERA',
  description: 'Refund and Cancellation Policy for VERA - Learn about our refund and cancellation terms for premium services.',
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm">
            <Link href="/" className="text-gray-600 hover:text-blue-600">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900">Refund and Cancellation Policy</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund and Cancellation Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: 10 September 2025</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Scope</h2>
              <p className="text-gray-700 mb-4">
                Applies to payments made to VERA only. Buyer–seller transactions are excluded.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Non-Refundable Services</h2>
              <p className="text-gray-700 mb-4">
                Completed services (e.g., published listings) are non-refundable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Refund Eligibility</h2>
              <p className="text-gray-700 mb-4">Permitted only where:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Duplicate payment occurred.</li>
                <li>System prevented delivery of purchased service.</li>
                <li>Refund required under the laws of the <strong>Democratic Socialist Republic of Sri Lanka</strong>.</li>
              </ul>
              <p className="text-gray-700">
                Requests must be made within <strong>7 days</strong> of payment.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cancellation</h2>
              <p className="text-gray-700 mb-4">
                Free accounts may be cancelled anytime. Subscription services may be cancelled, but fees already paid are non-refundable unless mandated by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Refund Process</h2>
              <p className="text-gray-700 mb-4">
                Requests to <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a>. Refunds processed within <strong>14 business days</strong> to the original payment method.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Changes</h2>
              <p className="text-gray-700 mb-4">
                We may revise this policy at any time.
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
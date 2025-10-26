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
                This policy applies only to payments made directly to VERA for services such as ad promotions, featured listings, membership subscriptions, or subscription packages. It does not apply to buyer–seller transactions conducted through the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. General Policy on Refunds</h2>
              <p className="text-gray-700 mb-4">
                All payments made to VERA are <strong>non-refundable</strong>, except in specific cases listed under Section 3. Once a service (such as an ad promotion, membership, or feature upgrade) is activated or completed, refunds will not be issued.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Refund Eligibility</h2>
              <p className="text-gray-700 mb-4">Refunds will only be considered under the following conditions:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>A duplicate payment was made for the same service.</li>
                <li>A system error or technical failure prevented the delivery or activation of a purchased service.</li>
                <li>A refund is legally required under the laws of the Democratic Socialist Republic of Sri Lanka.</li>
              </ul>
              <p className="text-gray-700">
                Refund requests must be submitted within <strong>7 days</strong> of the original payment date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Membership Subscriptions</h2>
              <p className="text-gray-700 mb-4">
                Membership subscriptions are <strong>strictly non-refundable</strong> for any reason, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Change of mind</li>
                <li>Dissatisfaction with the service</li>
                <li>Accidental activation or purchase</li>
              </ul>
              <p className="text-gray-700">
                Refunds will only be issued if VERA fails to deliver the subscribed service due to a verified technical issue on our end.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cancellations</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Free Accounts:</strong> Can be cancelled at any time without charge.</li>
                <li><strong>Paid Subscriptions or Services:</strong> You may cancel at any time, but payments already made are <strong>non-refundable</strong>, unless covered by the conditions in Section 3. Cancellation will stop future renewals but not generate a refund for the current billing period.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Refund Request Process</h2>
              <p className="text-gray-700 mb-4">
                To request a refund, email <a href="mailto:support@vera.lk" className="text-blue-600 hover:underline">support@vera.lk</a> with your payment details and reason for the request.
              </p>
              <p className="text-gray-700 mb-4">
                Approved refunds will be processed within <strong>14 business days</strong> and issued to the original payment method.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Policy Changes</h2>
              <p className="text-gray-700 mb-4">
                VERA reserves the right to modify or update this policy at any time without prior notice. Updated versions take effect immediately upon publication.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
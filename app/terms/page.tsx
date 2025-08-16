import Link from 'next/link'

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
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using AutoTrader.lk ("the Platform"), you accept and agree to be bound by these Terms & Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Platform Services</h2>
              <p className="text-gray-700 mb-4">
                AutoTrader.lk provides an online marketplace for buying and selling vehicles in Sri Lanka. Our services include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Vehicle listing and browsing capabilities</li>
                <li>User account management and profiles</li>
                <li>Communication tools between buyers and sellers</li>
                <li>Wanted requests functionality</li>
                <li>AI-powered listing descriptions</li>
                <li>Vehicle analytics and insights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <p className="text-gray-700 mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Be responsible for all activities under your account</li>
                <li>Use only one account per person</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Listing Requirements and Guidelines</h2>
              <p className="text-gray-700 mb-4">
                When posting vehicle listings, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide accurate vehicle information and descriptions</li>
                <li>Use only genuine photographs of the actual vehicle</li>
                <li>Set fair and reasonable pricing</li>
                <li>Ensure you have legal authority to sell the vehicle</li>
                <li>Update or remove listings promptly when vehicles are sold</li>
                <li>Not post duplicate or spam listings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Activities</h2>
              <p className="text-gray-700 mb-4">
                You agree not to use the Platform to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Post false, misleading, or fraudulent listings</li>
                <li>Sell stolen or illegally obtained vehicles</li>
                <li>Engage in money laundering or other illegal activities</li>
                <li>Harass, abuse, or spam other users</li>
                <li>Circumvent our fee structure or payment systems</li>
                <li>Use automated tools to scrape or harvest data</li>
                <li>Impersonate other individuals or entities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Transactions and Payments</h2>
              <p className="text-gray-700 mb-4">
                AutoTrader.lk facilitates connections between buyers and sellers but is not party to the actual transactions. 
                All sales are conducted directly between users. We recommend:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Meeting in safe, public locations for vehicle inspections</li>
                <li>Verifying vehicle documentation before purchase</li>
                <li>Using secure payment methods</li>
                <li>Conducting thorough inspections before finalizing purchases</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Platform Fees and Charges</h2>
              <p className="text-gray-700 mb-4">
                Certain premium features may require payment. All fees are clearly displayed before purchase. 
                We reserve the right to modify our fee structure with reasonable notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Platform's content, features, and functionality are owned by AutoTrader.lk and protected by copyright, 
                trademark, and other intellectual property laws. You retain ownership of content you post but grant us 
                necessary licenses to operate the Platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-4">
                The Platform is provided "as is" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Accuracy of user-posted information</li>
                <li>Successful completion of transactions</li>
                <li>Uninterrupted platform availability</li>
                <li>Freedom from errors or security vulnerabilities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                AutoTrader.lk shall not be liable for any indirect, incidental, special, or consequential damages 
                arising from your use of the Platform. Our total liability is limited to the amount you paid for our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately for violations of these terms. 
                You may terminate your account at any time by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These terms are governed by the laws of Sri Lanka. Any disputes will be resolved in the courts of Sri Lanka.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms & Conditions from time to time. Continued use of the Platform 
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms & Conditions, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> legal@autotrader.lk
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Address:</strong> AutoTrader.lk, Colombo, Sri Lanka
                </p>
                <p className="text-gray-700">
                  <strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (IST)
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
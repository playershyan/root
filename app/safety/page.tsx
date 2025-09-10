import Link from 'next/link'
import { Shield, AlertTriangle, CheckCircle, Phone, Mail, Clock, AlertCircle, Eye, Ban, UserCheck, TrendingUp, Database, Users } from 'lucide-react'

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-black">Safety & Fraud Detection</h1>
            <p className="text-lg sm:text-xl max-w-3xl mx-auto text-gray-600">
              Your Security is Our Priority
            </p>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            At VERA.lk, we're committed to creating the safest possible environment for buying and selling vehicles. 
            Our advanced monitoring systems, combined with community reporting tools, work around the clock to protect 
            our users from fraud and ensure legitimate transactions.
          </p>
        </div>
      </div>

      {/* How We Keep You Safe */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">How We Keep You Safe</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Advanced Fraud Detection</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Our sophisticated monitoring systems continuously scan for suspicious activity, fake listings, 
                  and fraudulent behavior patterns. We use machine learning algorithms to identify and block 
                  potential scams before they reach our users.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Report Ad Feature</h3>
                <p className="text-gray-600">
                  Every listing includes a "Report Ad" button that allows our community to flag suspicious 
                  content immediately. Our dedicated safety team reviews every report within hours, taking 
                  swift action when necessary.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Ban className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Repeat Offender Prevention</h3>
                <p className="text-gray-600">
                  We maintain a comprehensive database of fraudulent users and their behavior patterns. 
                  Our system automatically blocks repeat offenders from creating new accounts, using advanced 
                  tracking methods to prevent them from returning to our platform.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Identity Verification</h3>
                <p className="text-gray-600">
                  We verify seller information and cross-reference it with official databases to ensure 
                  legitimacy. Verified sellers receive special badges, giving buyers additional confidence 
                  in their transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Buying Tips */}
      <div className="bg-blue-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Smart Buying Tips for Vehicle Purchases</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Before You Buy */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Before You Buy</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base text-gray-700"><strong>Always inspect the vehicle in person</strong> during daylight hours at a safe, public location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Verify the seller's identity</strong> and match it with official documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Check vehicle history reports</strong> using the VIN number</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Confirm ownership documents</strong> are legitimate and match the seller's identity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Research market prices</strong> to ensure the asking price is realistic</span>
                </li>
              </ul>
            </div>

            {/* During the Transaction */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">During the Transaction</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Meet in safe, public locations</strong> such as bank parking lots or police station visitor areas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Bring a knowledgeable friend</strong> or consider hiring a qualified mechanic for inspection</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Test drive thoroughly</strong> and check all vehicle systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Exchange payment and title simultaneously</strong> - never pay before receiving proper documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Use secure payment methods</strong> such as cashier's checks or bank transfers for large amounts</span>
                </li>
              </ul>
            </div>

            {/* Payment Security */}
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-4 text-red-700">Payment Security</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Avoid cash transactions</strong> for high-value vehicles</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Never wire money</strong> to unknown parties</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Don't provide financial information</strong> until you've verified the seller and vehicle</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700"><strong>Use escrow services</strong> for expensive vehicles when possible</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Red Flags to Watch For</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Suspicious Listing Behaviors */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-red-700">
              <AlertTriangle className="inline-block w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600" />
              Suspicious Listing Behaviors
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-700">
              <li>• Prices significantly below market value</li>
              <li>• Sellers who refuse to meet in person</li>
              <li>• Requests for immediate payment or deposits</li>
              <li>• Poor quality or limited photos</li>
              <li>• Sellers who avoid phone conversations</li>
              <li>• Pressure to "act fast" or limited-time offers</li>
            </ul>
          </div>

          {/* Common Vehicle Scams */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-red-700">
              <AlertTriangle className="inline-block w-6 h-6 mr-2 text-red-600" />
              Common Vehicle Scams
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li><strong>Title washing</strong> - vehicles with hidden damage history</li>
              <li><strong>Curbstoning</strong> - unlicensed dealers posing as private sellers</li>
              <li><strong>Phantom vehicles</strong> - listings for vehicles that don't exist</li>
              <li><strong>Overpayment scams</strong> - fake buyers offering to overpay with bad checks</li>
              <li><strong>Shipping scams</strong> - requests to ship vehicles sight unseen</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Our Monitoring Technology */}
      <div className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Monitoring Technology</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <Eye className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-Time Detection</h3>
              <p className="text-gray-600">
                Our systems monitor listings 24/7, automatically flagging content that matches known fraud patterns. 
                Suspicious listings are immediately reviewed by our safety team and removed if necessary.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <Database className="w-10 h-10 text-black mb-4" />
              <h3 className="text-lg font-semibold mb-2">Pattern Recognition</h3>
              <p className="text-gray-600">
                We track user behavior across our platform, identifying suspicious patterns such as multiple accounts, 
                rapid listing creation, or communication that matches known scam scripts.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
              <Users className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Database Cross-Referencing</h3>
              <p className="text-gray-600">
                We maintain connections with law enforcement databases and industry fraud prevention services to 
                identify known fraudulent vehicles and sellers before they can harm our users.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What to Do If You Encounter Fraud */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">What to Do If You Encounter Fraud</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Immediate Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-4 text-red-700">Immediate Actions</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                <span className="text-gray-700"><strong>Stop all communication</strong> with the suspected fraudster</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                <span className="text-gray-700"><strong>Save all evidence</strong> including messages, emails, and screenshots</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                <span className="text-gray-700"><strong>Report the incident</strong> using our Report Ad feature</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                <span className="text-gray-700"><strong>Contact local law enforcement</strong> if money has been exchanged</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">5</span>
                <span className="text-gray-700"><strong>Notify your bank</strong> if you've provided any financial information</span>
              </li>
            </ol>
          </div>

          {/* How to Report */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">How to Report</h3>
            <ul className="space-y-3">
              <li className="text-gray-700">• Click the "Report Ad" button on any suspicious listing</li>
              <li className="text-gray-700">• Use our dedicated fraud reporting email: <a href="mailto:safety@vera.lk" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">safety@vera.lk</a></li>
              <li className="text-gray-700">• Call our safety hotline: <strong>+94 11 234 5678</strong></li>
              <li className="text-gray-700">• Provide detailed information about the incident</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal Cooperation */}
      <div className="bg-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Legal Cooperation</h2>
            <p className="text-gray-700 leading-relaxed">
              We take fraud seriously and maintain full cooperation with law enforcement agencies. When criminal 
              activity is suspected, we provide all necessary information to help investigate and prosecute offenders. 
              Our legal team works closely with local and federal authorities to ensure justice is served.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Safety Resources */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Additional Safety Resources</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Sellers */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">For Sellers</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Price your vehicle realistically</strong> based on market research</li>
              <li>• <strong>Provide complete, accurate descriptions</strong> and high-quality photos</li>
              <li>• <strong>Meet buyers in safe, public locations</strong> only</li>
              <li>• <strong>Verify buyer payment</strong> before transferring ownership</li>
              <li>• <strong>Keep detailed records</strong> of all communications and transactions</li>
            </ul>
          </div>

          {/* For Buyers */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">For Buyers</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Research extensively</strong> before making any commitment</li>
              <li>• <strong>Arrange independent inspections</strong> for valuable vehicles</li>
              <li>• <strong>Verify all documentation</strong> before payment</li>
              <li>• <strong>Trust your instincts</strong> - if something feels wrong, walk away</li>
              <li>• <strong>Use our verification tools</strong> to check seller credibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Our Safety Team */}
      <div className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Contact Our Safety Team</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8">Our dedicated safety specialists are available to help with any concerns:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-700 transition-colors duration-300">
                <Phone className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-blue-600" />
                <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Safety Hotline</h3>
                <p className="text-gray-300 text-sm sm:text-base">+94 11 234 5678</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-700 transition-colors duration-300">
                <Mail className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-300">safety@vera.lk</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 sm:p-6 hover:bg-gray-700 transition-colors duration-300">
                <Clock className="w-8 h-8 mx-auto mb-3 text-black" />
                <h3 className="font-semibold mb-2">Hours</h3>
                <p className="text-gray-300 text-sm">Mon-Fri 8AM-8PM<br/>Weekend Emergency Support</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-red-600 rounded-lg max-w-3xl mx-auto">
              <p className="text-base sm:text-lg font-semibold">
                <AlertTriangle className="inline-block w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Remember: If you feel unsafe at any point during a transaction, trust your instincts 
                and remove yourself from the situation. No vehicle purchase is worth your personal safety.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>
            <em>Last updated: {new Date().toLocaleDateString()} | We continuously update our safety measures 
            and recommend reviewing this page regularly for the latest protection information.</em>
          </p>
        </div>
      </div>
    </div>
  )
}
import Link from 'next/link'
import { Shield, AlertTriangle, CheckCircle, Phone, Mail, Clock, AlertCircle, Eye, Ban, UserCheck, TrendingUp, Database, Users, Lock } from 'lucide-react'

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 md:py-24 overflow-hidden">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            AI-Powered Security
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Safety & Fraud Detection
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Advanced AI monitoring and community protection keep your transactions secure
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Trusted by Thousands
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Your Security is Our Priority
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              At VERA.lk, we're committed to creating the safest possible environment for buying and selling vehicles. 
              Our advanced AI-powered monitoring systems, combined with community reporting tools, work around the clock 
              to protect our users from fraud and ensure legitimate transactions.
            </p>
          </div>
        </div>
      </section>

      {/* Red Flags Section - Prevention First */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How to Stay Safe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn to recognize scams and protect yourself from fraud
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Common Scams */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Red Flags to Watch For</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Too good to be true prices</strong> - Extremely low prices for high-value vehicles</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Pressure to pay quickly</strong> - Urgent requests for immediate payment</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Poor quality photos</strong> - Blurry or stock images instead of real photos</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Vague descriptions</strong> - Lack of specific details about the vehicle</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Refusal to meet</strong> - Avoiding in-person meetings or inspections</p>
                </div>
              </div>
            </div>

            {/* What to Do */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Safe Practices</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Always inspect the vehicle</strong> in person before making any payment</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Verify seller identity</strong> and ask for proper documentation</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Use secure payment methods</strong> and avoid wire transfers</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Trust your instincts</strong> - if something feels wrong, walk away</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700"><strong>Report suspicious activity</strong> immediately to our safety team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Keep You Safe */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How We Protect You
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Multi-layered protection powered by advanced AI and human expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Advanced Fraud Detection */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Fraud Detection</h3>
              <p className="text-gray-600 leading-relaxed">
                Our sophisticated AI systems continuously scan for suspicious activity, fake listings, 
                and fraudulent behavior patterns using machine learning algorithms.
              </p>
            </div>

            {/* Community Reporting */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Reporting</h3>
              <p className="text-gray-600 leading-relaxed">
                Our active community helps identify and report suspicious activities. 
                Every report is reviewed by our safety team within 24 hours.
              </p>
            </div>

            {/* Identity Verification */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Identity Verification</h3>
              <p className="text-gray-600 leading-relaxed">
                We verify seller identities and vehicle information to ensure authenticity. 
                Verified sellers receive special badges for transparency.
              </p>
            </div>

            {/* Real-time Monitoring */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">24/7 Monitoring</h3>
              <p className="text-gray-600 leading-relaxed">
                Our systems monitor all platform activity around the clock, 
                automatically flagging and removing suspicious content.
              </p>
            </div>

            {/* Secure Transactions */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure Communication</h3>
              <p className="text-gray-600 leading-relaxed">
                All communications are encrypted and monitored. 
                We never share your personal information with third parties.
              </p>
            </div>

            {/* Data Protection */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-8 group">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Data Protection</h3>
              <p className="text-gray-600 leading-relaxed">
                Your personal data is protected with industry-standard encryption 
                and security measures, compliant with international standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Response */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <AlertCircle className="w-4 h-4" />
                Emergency Response
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                If You've Been Scammed
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Take immediate action to protect yourself and help us catch the perpetrators
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Immediate Actions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Immediate Actions</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                    <span className="text-gray-700"><strong>Stop all communication</strong> with the scammer immediately</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                    <span className="text-gray-700"><strong>Document everything</strong> - save screenshots, messages, and transaction details</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                    <span className="text-gray-700"><strong>Report to VERA</strong> using our dedicated fraud reporting system</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                    <span className="text-gray-700"><strong>Contact local authorities</strong> and file a police report</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">5</span>
                    <span className="text-gray-700"><strong>Notify your bank</strong> if you've provided any financial information</span>
                  </li>
                </ol>
              </div>

              {/* How to Report */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Report</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Online Reporting</h4>
                    <p className="text-gray-600 text-sm mb-2">Click the "Report Ad" button on any suspicious listing</p>
                    <a href="mailto:safety@vera.lk" className="text-blue-600 hover:underline text-sm">safety@vera.lk</a>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Phone Support</h4>
                    <p className="text-gray-600 text-sm mb-2">Call our safety hotline for immediate assistance</p>
                    <a href="tel:+94112345678" className="text-blue-600 hover:underline text-sm font-semibold">+94 11 234 5678</a>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">What to Include</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• Screenshots of conversations</li>
                      <li>• Transaction details</li>
                      <li>• Seller information</li>
                      <li>• Timeline of events</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Cooperation */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              Legal Cooperation
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Working with Law Enforcement
            </h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              We work closely with law enforcement agencies to investigate fraud cases and bring perpetrators to justice. 
              All fraud reports are shared with relevant authorities when necessary.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Our Commitment</h3>
                <p className="text-gray-600 text-sm">
                  We maintain detailed records of all fraudulent activities and cooperate fully with 
                  law enforcement investigations to protect our community.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Your Privacy</h3>
                <p className="text-gray-600 text-sm">
                  Your personal information is protected and only shared with authorities 
                  when legally required for fraud investigations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, Briefcase, Users, MapPin, Clock } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

export default function CareersPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const { error } = await supabase
        .from('career_notifications')
        .insert([
          {
            email: email.trim(),
            created_at: new Date().toISOString()
          }
        ])

      if (error) {
        throw error
      }

      setIsSubmitted(true)
      setEmail('')
    } catch (error) {
      logger.error('Error submitting notification request', error as Error)
      setError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Briefcase className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Careers</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our mission to revolutionize the automotive marketplace in Sri Lanka
          </p>
        </div>

        {/* Current Status Banner */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 text-center border-l-4 border-blue-500">
          <div className="flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900">No Current Openings</h2>
          </div>
          <p className="text-gray-600 mb-6 text-lg">
            We don't have any job openings at the moment, but exciting opportunities might be available in the near future!
          </p>
          
          {/* Email Notification Form */}
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Get Notified</h3>
            <p className="text-gray-600 mb-6">
              Be the first to know when we have new job openings
            </p>

            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-green-700 font-medium">
                    Thank you! We'll notify you when positions become available.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Notify Me'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Company Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Our Location</h3>
            </div>
            <p className="text-gray-600">
              Based in beautiful Sri Lanka, we're building the future of automotive commerce in the region.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Work Culture</h3>
            </div>
            <p className="text-gray-600">
              We believe in flexible work arrangements, continuous learning, and building great products together.
            </p>
          </div>
        </div>

        {/* Future Opportunities */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Types of Roles We May Offer
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">FE</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Frontend Development</h4>
              <p className="text-sm text-gray-600">React, Next.js, TypeScript</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">BE</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Backend Development</h4>
              <p className="text-sm text-gray-600">Node.js, APIs, Databases</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">UI</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">UI/UX Design</h4>
              <p className="text-sm text-gray-600">Product Design, User Research</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">MK</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Marketing</h4>
              <p className="text-sm text-gray-600">Digital Marketing, Content</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-red-600 font-bold">CS</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Customer Support</h4>
              <p className="text-sm text-gray-600">User Experience, Support</p>
            </div>

            <div className="text-center p-4">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-600 font-bold">DA</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Data & Analytics</h4>
              <p className="text-sm text-gray-600">Business Intelligence, Insights</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
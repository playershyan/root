'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PostWantedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    min_budget: '',
    max_budget: '',
    make: '',
    model: '',
    min_year: '',
    max_year: '',
    location: '',
    phone: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('wanted_requests').insert([
        {
          title: formData.title,
          description: formData.description,
          min_budget: formData.min_budget ? parseFloat(formData.min_budget) : null,
          max_budget: formData.max_budget ? parseFloat(formData.max_budget) : null,
          make: formData.make || null,
          model: formData.model || null,
          min_year: formData.min_year ? parseInt(formData.min_year) : null,
          max_year: formData.max_year ? parseInt(formData.max_year) : null,
          location: formData.location,
          phone: formData.phone,
        },
      ])

      if (error) throw error

      // Show alert message (fake for MVP)
      alert('✅ Wanted request posted! We will notify matching sellers.')
      router.push('/wanted')
    } catch (error) {
      alert('Error posting request. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Post Wanted Request</h1>

        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <p className="text-blue-800">
            <strong>How it works:</strong> Post what you're looking for, and we'll notify sellers with matching vehicles!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">What are you looking for?</label>
            <input
              type="text"
              required
              placeholder="e.g., Looking for Toyota Prius 2018-2020"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Minimum Budget (Rs.)</label>
              <input
                type="number"
                placeholder="e.g., 5000000"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.min_budget}
                onChange={(e) => setFormData({ ...formData, min_budget: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Budget (Rs.)</label>
              <input
                type="number"
                placeholder="e.g., 8000000"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.max_budget}
                onChange={(e) => setFormData({ ...formData, max_budget: e.target.value })}
              />
            </div>
          </div>

          {/* Vehicle Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Make (optional)</label>
              <input
                type="text"
                placeholder="e.g., Toyota"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Preferred Model (optional)</label>
              <input
                type="text"
                placeholder="e.g., Prius"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Year (optional)</label>
              <input
                type="number"
                min="1990"
                max="2025"
                placeholder="e.g., 2018"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.min_year}
                onChange={(e) => setFormData({ ...formData, min_year: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Year (optional)</label>
              <input
                type="number"
                min="1990"
                max="2025"
                placeholder="e.g., 2020"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.max_year}
                onChange={(e) => setFormData({ ...formData, max_year: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Additional Requirements (optional)</label>
            <textarea
              rows={3}
              placeholder="e.g., Must have low mileage, prefer automatic transmission..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Location</label>
              <input
                type="text"
                required
                placeholder="e.g., Colombo"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Phone Number</label>
              <input
                type="tel"
                required
                placeholder="e.g., 0771234567"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Posting...' : 'Post Wanted Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
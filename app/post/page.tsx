'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PostVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    fuel_type: 'Petrol',
    transmission: 'Manual',
    location: '',
    phone: '',
    image_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('listings').insert([
        {
          ...formData,
          price: parseFloat(formData.price),
          year: parseInt(formData.year),
          mileage: parseInt(formData.mileage) || null,
        },
      ])

      if (error) throw error

      alert('Vehicle listed successfully!')
      router.push('/listings')
    } catch (error) {
      alert('Error posting vehicle. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const generateAIDescription = async () => {
    if (!formData.make || !formData.model || !formData.year) {
      alert('Please fill in make, model, and year first')
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: formData.make,
          model: formData.model,
          year: formData.year,
          mileage: formData.mileage,
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
        }),
      })

      const data = await response.json()
      if (data.description) {
        setFormData({ ...formData, description: data.description })
      }
    } catch (error) {
      alert('Error generating description')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Post Your Vehicle</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Listing Title</label>
            <input
              type="text"
              required
              placeholder="e.g., 2019 Toyota Prius - Excellent Condition"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Vehicle Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Make</label>
              <input
                type="text"
                required
                placeholder="e.g., Toyota"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Model</label>
              <input
                type="text"
                required
                placeholder="e.g., Prius"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Year</label>
              <input
                type="number"
                required
                min="1990"
                max="2025"
                placeholder="e.g., 2019"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Mileage (km)</label>
              <input
                type="number"
                placeholder="e.g., 45000"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.mileage}
                onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fuel Type</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Electric</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Transmission</label>
              <select
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.transmission}
                onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2">Price (Rs.)</label>
            <input
              type="number"
              required
              placeholder="e.g., 8500000"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          {/* Description with AI */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <div className="mb-2">
              <button
                type="button"
                onClick={generateAIDescription}
                disabled={aiLoading}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {aiLoading ? 'Generating...' : '✨ Generate AI Description'}
              </button>
            </div>
            <textarea
              rows={4}
              placeholder="Describe your vehicle..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                required
                placeholder="e.g., Colombo 5"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
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

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            <p className="text-sm text-gray-600 mt-1">
              For now, please use an image URL. Upload feature coming soon!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Posting...' : 'Post Vehicle'}
          </button>
        </form>
      </div>
    </div>
  )
}

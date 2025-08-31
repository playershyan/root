import { Suspense } from 'react'
import CloudinaryTestUpload from '@/app/components/CloudinaryTestUpload'

export default function CloudinaryTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cloudinary Integration Test</h1>
          <p className="mt-2 text-gray-600">
            Test image uploads with Cloudinary optimization and CDN delivery
          </p>
        </div>

        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
          <CloudinaryTestUpload />
        </Suspense>

        {/* Feature Info */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold">Auto-Optimization</h3>
            </div>
            <p className="text-gray-600">
              Images are automatically compressed and optimized for web delivery while maintaining quality.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold">Global CDN</h3>
            </div>
            <p className="text-gray-600">
              Images are served from the nearest edge server for fastest loading times worldwide.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold">Smart Formats</h3>
            </div>
            <p className="text-gray-600">
              Automatic WebP delivery for modern browsers, with JPEG fallback for older ones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
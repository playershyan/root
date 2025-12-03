'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function BulkImportPage() {
  const { user } = useAuth()
  const [csvText, setCsvText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [mode, setMode] = useState<'csv' | 'json'>('csv')

  const sampleCSV = `title,make,model,year,mileage,price,condition,fuelType,transmission,trim,engineCapacity,city,district,phone,imageUrls,vehicleType
2015 Honda Civic,Honda,Civic,2015,85000,2500000,Used,Petrol,Automatic,EX,1800,Colombo,Colombo,0771234567,https://example.com/img1.jpg,Car
2018 Toyota Aqua,Toyota,Aqua,2018,45000,,Used,Hybrid,Automatic,S,1500,Kandy,Kandy,0772345678,https://example.com/img2.jpg,Car`

  const sampleJSON = `[
  {
    "title": "2015 Honda Civic",
    "make": "Honda",
    "model": "Civic",
    "year": 2015,
    "mileage": 85000,
    "price": 2500000,
    "condition": "Used",
    "fuelType": "Petrol",
    "transmission": "Automatic",
    "trim": "EX",
    "engineCapacity": 1800,
    "city": "Colombo",
    "district": "Colombo",
    "phone": "0771234567",
    "imageUrls": "https://example.com/img1.jpg,https://example.com/img2.jpg",
    "vehicleType": "Car"
  }
]`

  const handleImport = async () => {
    setImporting(true)
    setResult(null)

    try {
      const payload = mode === 'csv'
        ? { csv: csvText }
        : { listings: JSON.parse(jsonText) }

      const response = await fetch('/api/admin/bulk-import-listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error: (error as Error).message,
        success: false
      })
    } finally {
      setImporting(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access bulk import</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import Listings</h1>
          <p className="text-gray-600">Import multiple listings from CSV or JSON format</p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode('csv')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              CSV Format
            </button>
            <button
              onClick={() => setMode('json')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="inline-block w-4 h-4 mr-2" />
              JSON Format
            </button>
          </div>

          {/* CSV Input */}
          {mode === 'csv' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Data
              </label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={sampleCSV}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <button
                onClick={() => setCsvText(sampleCSV)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Load sample CSV
              </button>
            </div>
          )}

          {/* JSON Input */}
          {mode === 'json' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste JSON Data
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={sampleJSON}
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <button
                onClick={() => setJsonText(sampleJSON)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Load sample JSON
              </button>
            </div>
          )}

          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={importing || (mode === 'csv' ? !csvText : !jsonText)}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Start Import
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Import Results</h2>

            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <XCircle className="w-5 h-5" />
                  Error
                </div>
                <p className="text-red-700">{result.error}</p>
                {result.message && <p className="text-red-600 text-sm mt-1">{result.message}</p>}
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium mb-1">Imported</div>
                    <div className="text-3xl font-bold text-green-600">{result.imported}</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-medium mb-1">Failed</div>
                    <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 font-medium mb-1">Duration</div>
                    <div className="text-3xl font-bold text-blue-600">{result.duration}</div>
                  </div>
                </div>

                {/* Successfully Imported Listings */}
                {result.listings && result.listings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Successfully Imported ({result.listings.length})
                    </h3>
                    <div className="space-y-2">
                      {result.listings.map((listing: any) => (
                        <div key={listing.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                          <span className="text-gray-900">{listing.title}</span>
                          <a
                            href={`/listings/${listing.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View →
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      Errors ({result.errors.length})
                    </h3>
                    <div className="space-y-2">
                      {result.errors.map((error: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="font-medium text-red-800 mb-1">
                            Row {error.row}: {error.error}
                          </div>
                          {error.data && (
                            <pre className="text-xs text-red-700 mt-2 overflow-x-auto">
                              {JSON.stringify(error.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Documentation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">CSV Format</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">Required fields (at least one):</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
              <li><code className="bg-gray-200 px-1 rounded">make</code> - Vehicle manufacturer</li>
              <li><code className="bg-gray-200 px-1 rounded">model</code> - Vehicle model</li>
            </ul>

            <p className="text-sm text-gray-700 mb-2">Optional fields:</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li><code className="bg-gray-200 px-1 rounded">title</code> - Listing title (auto-generated if empty)</li>
              <li><code className="bg-gray-200 px-1 rounded">year</code> - Manufacturing year</li>
              <li><code className="bg-gray-200 px-1 rounded">mileage</code> - Odometer reading</li>
              <li><code className="bg-gray-200 px-1 rounded">price</code> - Price in LKR (null for "Price on Request")</li>
              <li><code className="bg-gray-200 px-1 rounded">condition</code> - Used, New, Refurbished</li>
              <li><code className="bg-gray-200 px-1 rounded">fuelType</code> - Petrol, Diesel, Hybrid, Electric</li>
              <li><code className="bg-gray-200 px-1 rounded">transmission</code> - Automatic, Manual</li>
              <li><code className="bg-gray-200 px-1 rounded">trim</code> - Vehicle trim/grade (e.g., EX, LX, Sport, G, S, X)</li>
              <li><code className="bg-gray-200 px-1 rounded">engineCapacity</code> - Engine size in CC (e.g., 1500, 1800, 2000)</li>
              <li><code className="bg-gray-200 px-1 rounded">city</code>, <code className="bg-gray-200 px-1 rounded">district</code> - Location</li>
              <li><code className="bg-gray-200 px-1 rounded">phone</code> - Contact number</li>
              <li><code className="bg-gray-200 px-1 rounded">imageUrls</code> - Comma-separated image URLs (uploaded to Cloudinary)</li>
              <li><code className="bg-gray-200 px-1 rounded">vehicleType</code> - Car, Van, Bus, Motorcycle, etc.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

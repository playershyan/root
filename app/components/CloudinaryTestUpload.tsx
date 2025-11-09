'use client'

// Fixed: Resolved Sentry syntax error - file structure verified
import { useState } from 'react'
import { Upload, Image as ImageIcon, Trash2, Eye } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface UploadedImage {
  url: string
  publicId: string
  thumbnail?: string
}

export default function CloudinaryTestUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('File input changed')

    const files = event.target.files
    logger.debug('Files from input', { filesCount: files?.length })

    if (files && files.length > 0) {
      logger.debug('Files details', { files: Array.from(files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })) })
    }

    if (!files || files.length === 0) {
      logger.debug('No files selected or files is null')
      return
    }

    logger.debug('Starting upload process')
    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()

      // Add all selected files
      logger.debug('Adding files to FormData', { count: files.length })
      Array.from(files).forEach((file, index) => {
        logger.debug(`Adding file ${index + 1}`, { name: file.name })
        formData.append('images', file)
      })

      // Optional: Add listing ID for organization
      formData.append('listingId', 'test-upload')
      logger.debug('FormData prepared')

      logger.debug('Sending request to /api/upload/cloudinary')
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      })

      logger.debug('Response received', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const result = await response.json()
      logger.debug('Response data received', { success: result.success })

      if (!response.ok) {
        logger.error('Upload failed', new Error(result.error || 'Upload failed'), { status: response.status })
        throw new Error(result.error || 'Upload failed')
      }

      if (result.success) {
        setUploadedImages(prev => [...prev, ...result.images])
        setSuccess(`Successfully uploaded ${result.totalUploaded} image(s)!`)
        
        if (result.totalFailed > 0) {
          setError(`${result.totalFailed} image(s) failed to upload.`)
        }
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error: any) {
      logger.error('Upload error', error)
      setError(error.message || 'Upload failed')
    } finally {
      setUploading(false)
      // Clear the file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleDeleteImage = async (publicId: string) => {
    try {
      const response = await fetch(`/api/upload/cloudinary?publicId=${encodeURIComponent(publicId)}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setUploadedImages(prev => prev.filter(img => img.publicId !== publicId))
        setSuccess('Image deleted successfully!')
      } else {
        setError('Failed to delete image')
      }
    } catch (error: any) {
      logger.error('Delete error', error)
      setError('Failed to delete image')
    }
  }

  const clearMessages = () => {
    setError('')
    setSuccess('')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cloudinary Test Upload</h2>
        <p className="text-gray-600">Test image uploads to Cloudinary with automatic optimization</p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-3 ${uploading ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
            <p className="mb-2 text-sm text-gray-500">
              {uploading ? (
                <span className="font-semibold text-blue-600">Uploading...</span>
              ) : (
                <>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, WebP up to 10MB (multiple files supported)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
        
        {/* Alternative upload button for testing */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Having issues? Try this alternative button:</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="text-sm text-gray-600"
          />
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
              <div className="flex justify-between items-start">
                <p className="text-red-700">{error}</p>
                <button onClick={clearMessages} className="text-red-500 hover:text-red-700">
                  ×
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <p className="text-green-700">{success}</p>
                <button onClick={clearMessages} className="text-green-500 hover:text-green-700">
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded Images ({uploadedImages.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={image.publicId || index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.thumbnail || image.url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = image.url // Fallback to original URL
                    }}
                  />
                </div>
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        title="View full size"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </a>
                      <button
                        onClick={() => handleDeleteImage(image.publicId)}
                        className="p-2 bg-white rounded-full shadow-sm hover:bg-red-50 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Image info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-500 truncate" title={image.publicId}>
                    ID: {image.publicId}
                  </p>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                  >
                    View Original
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedImages.length === 0 && !uploading && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No images uploaded yet. Try uploading some images above!</p>
        </div>
      )}
    </div>
  )
}
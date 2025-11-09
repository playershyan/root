'use client'

/**
 * Image upload component with client-side compression
 * Compresses images before upload to reduce network transfer time
 */

import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle, Loader2, Camera } from 'lucide-react'
import {
  compressImages,
  validateImageFiles,
  formatFileSize,
  calculateCompressionSavings,
  type CompressionResult,
  type CompressionProgress,
} from '@/lib/utils/image-compression'
import { UPLOAD_CONSTRAINTS } from '@/lib/config/images'
import { takePhoto, pickFromGallery, isNative } from '@/lib/capacitor-bridge'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

export interface ImageUploadWithCompressionProps {
  images: File[]
  imageUrls?: string[]
  imagePreviews: string[]
  maxImages?: number
  onImagesChange: (images: File[]) => void
  onImageUrlsChange?: (urls: string[]) => void
  onRemove: (index: number) => void
  errors?: string
  disabled?: boolean
}

export default function ImageUploadWithCompression({
  images,
  imageUrls = [],
  imagePreviews,
  maxImages = 15,
  onImagesChange,
  onImageUrlsChange,
  onRemove,
  errors,
  disabled = false,
}: ImageUploadWithCompressionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<Map<string, CompressionProgress>>(new Map())
  const [compressionResults, setCompressionResults] = useState<CompressionResult[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return

    // Check max images limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`)
      return
    }

    // Validate files
    const { valid, invalid } = validateImageFiles(files)

    // Show errors for invalid files
    if (invalid.length > 0) {
      invalid.forEach(({ file, error }) => {
        logger.warn('Invalid image file rejected', {
          component: 'ImageUploadWithCompression',
          action: 'processFiles',
          fileName: file.name,
          error
        })
        alert(`${file.name}: ${error}`)
      })
    }

    if (valid.length === 0) return

    // Compress images
    setCompressing(true)
    setCompressionProgress(new Map())

    try {
      const results = await compressImages(valid, (progressMap) => {
        setCompressionProgress(new Map(progressMap))
      })

      // Get compressed files
      const compressedFiles = results.map(r => r.file)

      // Calculate savings
      const savings = calculateCompressionSavings(results)

      // Log compression results
      logger.debug('Image compression completed', {
        component: 'ImageUploadWithCompression',
        action: 'processFiles',
        originalSize: savings.totalOriginalSize,
        compressedSize: savings.totalCompressedSize,
        savings: savings.totalSavings,
        savingsPercent: savings.savingsPercent
      })

      setCompressionResults(results)

      // Add compressed files to the list
      onImagesChange([...images, ...compressedFiles])

    } catch (error) {
      logger.error('Compression error', error as Error, {
        component: 'ImageUploadWithCompression',
        action: 'processFiles'
      })
      alert('Failed to compress images. Please try again.')
    } finally {
      setCompressing(false)
      setCompressionProgress(new Map())
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    await processFiles(files)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFiles(files)

    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleTakePhoto = async () => {
    try {
      const result = await takePhoto({
        quality: 90,
        allowEditing: false
      })

      if (result && result.base64String) {
        // Convert base64 to File object
        const byteCharacters = atob(result.base64String)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: `image/${result.format}` })
        const file = new File([blob], `photo_${Date.now()}.${result.format}`, {
          type: `image/${result.format}`
        })

        await processFiles([file])
      }
    } catch (error) {
      logger.error('Camera error during image capture', error as Error, {
        component: 'ImageUploadWithCompression',
        action: 'handleTakePhoto'
      })
      // Fallback to file input
      fileInputRef.current?.click()
    }
  }

  const handlePickFromGallery = async () => {
    try {
      const result = await pickFromGallery({
        quality: 90,
        allowEditing: false
      })

      if (result && result.base64String) {
        // Convert base64 to File object
        const byteCharacters = atob(result.base64String)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: `image/${result.format}` })
        const file = new File([blob], `photo_${Date.now()}.${result.format}`, {
          type: `image/${result.format}`
        })

        await processFiles([file])
      }
    } catch (error) {
      logger.error('Gallery picker error', error as Error, {
        component: 'ImageUploadWithCompression',
        action: 'handlePickFromGallery'
      })
      // Fallback to file input
      fileInputRef.current?.click()
    }
  }

  return (
    <div>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-300'
        } ${errors ? 'border-red-300' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={UPLOAD_CONSTRAINTS.allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || compressing}
        />

        {compressing ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
            <p className="text-lg font-medium text-gray-700">Optimizing images...</p>
            <p className="text-sm text-gray-500">
              Compressing and resizing for faster upload
            </p>

            {/* Compression Progress */}
            {compressionProgress.size > 0 && (
              <div className="max-w-md mx-auto space-y-2">
                {Array.from(compressionProgress.values()).map((progress) => (
                  <div key={progress.fileName} className="text-left">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate max-w-[200px]">{progress.fileName}</span>
                      <span className="text-gray-500">
                        {progress.status === 'completed' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : progress.status === 'error' ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          `${progress.progress}%`
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          progress.status === 'completed'
                            ? 'bg-green-600'
                            : progress.status === 'error'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2 text-gray-700">
              Drag and drop photos here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-900 hover:underline"
                disabled={disabled}
              >
                browse
              </button>
            </p>
            
            {/* Native camera/gallery buttons */}
            {isNative() && (
              <div className="flex justify-center gap-3 mt-3">
                <Button
                  type="button"
                  onClick={handleTakePhoto}
                  disabled={disabled || compressing}
                  variant="primary"
                  className="h-12"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button
                  type="button"
                  onClick={handlePickFromGallery}
                  disabled={disabled || compressing}
                  variant="secondary"
                  className="h-12"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Gallery
                </Button>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-3">
              At least 1 photo required. Maximum {maxImages} photos.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Images over {formatFileSize(UPLOAD_CONSTRAINTS.maxFileSizeBeforeCompression)} will be automatically optimized
            </p>
          </>
        )}
      </div>

      {errors && <p className="text-red-600 text-sm mt-1">{errors}</p>}

      {/* Compression Results Summary */}
      {compressionResults.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <Check className="w-4 h-4 inline mr-1" />
            Images optimized! Saved{' '}
            <strong>
              {formatFileSize(calculateCompressionSavings(compressionResults).totalSavings)}
            </strong>{' '}
            ({calculateCompressionSavings(compressionResults).savingsPercent.toFixed(1)}% reduction)
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
          {imagePreviews.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity min-h-touch min-w-touch active:scale-95"
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Show compression info if available */}
              {compressionResults[index] && compressionResults[index].wasCompressed && (
                <div className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded text-center">
                  Optimized {compressionResults[index].compressionRatio < 1 ?
                    `${((1 - compressionResults[index].compressionRatio) * 100).toFixed(0)}%` :
                    ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

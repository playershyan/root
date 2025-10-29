/**
 * Client-side image compression utilities
 * Reduces file size before upload to improve upload speed
 */

'use client'

import {
  UPLOAD_CONSTRAINTS,
  needsCompression,
  needsResize,
} from '@/lib/config/images'

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
  wasCom pressed: boolean
  wasResized: boolean
}

export interface CompressionProgress {
  fileName: string
  progress: number // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

/**
 * Load image from File to HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

/**
 * Calculate dimensions to fit within max constraints while preserving aspect ratio
 */
function calculateResizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = UPLOAD_CONSTRAINTS.maxDimensions.width,
  maxHeight: number = UPLOAD_CONSTRAINTS.maxDimensions.height
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // Calculate aspect ratio
  const aspectRatio = width / height

  // Check if resizing is needed
  if (width > maxWidth || height > maxHeight) {
    if (width / maxWidth > height / maxHeight) {
      // Width is the limiting factor
      width = maxWidth
      height = Math.round(width / aspectRatio)
    } else {
      // Height is the limiting factor
      height = maxHeight
      width = Math.round(height * aspectRatio)
    }
  }

  return { width, height }
}

/**
 * Compress image using Canvas API
 */
async function compressImageToBlob(
  img: HTMLImageElement,
  quality: number = UPLOAD_CONSTRAINTS.compressionQuality,
  targetDimensions?: { width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Set canvas dimensions
      const { width, height } = targetDimensions || {
        width: img.width,
        height: img.height,
      }
      canvas.width = width
      canvas.height = height

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'))
            return
          }
          resolve(blob)
        },
        'image/jpeg', // Always convert to JPEG for best compression
        quality
      )
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Compress single image file
 */
export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size

  try {
    onProgress?.(10)

    // Load image
    const img = await loadImage(file)
    onProgress?.(30)

    const originalWidth = img.width
    const originalHeight = img.height

    // Determine if compression/resizing is needed
    const shouldCompress = needsCompression(file.size)
    const shouldResize = needsResize(originalWidth, originalHeight)

    // If no optimization needed, return original
    if (!shouldCompress && !shouldResize) {
      onProgress?.(100)
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1.0,
        width: originalWidth,
        height: originalHeight,
        wasCompressed: false,
        wasResized: false,
      }
    }

    // Calculate target dimensions
    const targetDimensions = shouldResize
      ? calculateResizedDimensions(originalWidth, originalHeight)
      : { width: originalWidth, height: originalHeight }

    onProgress?.(50)

    // Compress image
    const blob = await compressImageToBlob(img, UPLOAD_CONSTRAINTS.compressionQuality, targetDimensions)
    onProgress?.(80)

    // Convert blob to File
    const compressedFile = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, '.jpg'), // Change extension to .jpg
      {
        type: 'image/jpeg',
        lastModified: Date.now(),
      }
    )

    onProgress?.(100)

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio: compressedFile.size / originalSize,
      width: targetDimensions.width,
      height: targetDimensions.height,
      wasCompressed: true,
      wasResized: shouldResize,
    }
  } catch (error) {
    throw new Error(`Failed to compress ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Compress multiple images with progress tracking
 */
export async function compressImages(
  files: File[],
  onProgress?: (progressMap: Map<string, CompressionProgress>) => void
): Promise<CompressionResult[]> {
  const progressMap = new Map<string, CompressionProgress>()

  // Initialize progress for all files
  files.forEach((file) => {
    progressMap.set(file.name, {
      fileName: file.name,
      progress: 0,
      status: 'pending',
    })
  })

  onProgress?.(progressMap)

  // Process files sequentially to avoid overloading browser
  const results: CompressionResult[] = []

  for (const file of files) {
    try {
      // Update status
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'processing',
      })
      onProgress?.(progressMap)

      // Compress
      const result = await compressImage(file, (progress) => {
        progressMap.set(file.name, {
          fileName: file.name,
          progress,
          status: 'processing',
        })
        onProgress?.(progressMap)
      })

      results.push(result)

      // Mark completed
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 100,
        status: 'completed',
      })
      onProgress?.(progressMap)
    } catch (error) {
      // Mark error
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onProgress?.(progressMap)

      // Add original file as fallback
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1.0,
        width: 0,
        height: 0,
        wasCompressed: false,
        wasResized: false,
      })
    }
  }

  return results
}

/**
 * Validate image file before compression
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!UPLOAD_CONSTRAINTS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: ${UPLOAD_CONSTRAINTS.allowedTypes.join(', ')}`,
    }
  }

  // Check file size (even before compression, shouldn't exceed 10MB server limit)
  const maxServerSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxServerSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB`,
    }
  }

  return { valid: true }
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): {
  valid: File[]
  invalid: Array<{ file: File; error: string }>
} {
  const valid: File[] = []
  const invalid: Array<{ file: File; error: string }> = []

  // Check max files limit
  if (files.length > UPLOAD_CONSTRAINTS.maxFiles) {
    return {
      valid: [],
      invalid: files.map((file) => ({
        file,
        error: `Too many files. Maximum: ${UPLOAD_CONSTRAINTS.maxFiles}`,
      })),
    }
  }

  files.forEach((file) => {
    const validation = validateImageFile(file)
    if (validation.valid) {
      valid.push(file)
    } else {
      invalid.push({ file, error: validation.error || 'Unknown error' })
    }
  })

  return { valid, invalid }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Calculate total compression savings
 */
export function calculateCompressionSavings(results: CompressionResult[]): {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavings: number
  savingsPercent: number
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0)
  const totalSavings = totalOriginalSize - totalCompressedSize
  const savingsPercent = totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    savingsPercent,
  }
}

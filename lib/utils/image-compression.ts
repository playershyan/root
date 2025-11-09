/**
 * Client-side image compression utilities.
 *
 * Uses Canvas API to resize and compress images before uploading to Cloudinary.
 * Designed for browser environments – always guard usage behind client-side checks.
 */

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  targetSize?: number
  convertToWebP?: boolean
}

interface CompressionResult {
  file: File
  originalFile: File
  wasCompressed: boolean
  originalSize: number
  compressedSize: number
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1440,
  quality: 0.85,
  targetSize: 200 * 1024, // 200 KB
  convertToWebP: true,
}

const WEBP_SUPPORTED_CACHE: { value?: boolean } = {}

async function detectWebPSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  if (WEBP_SUPPORTED_CACHE.value !== undefined) {
    return WEBP_SUPPORTED_CACHE.value
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      WEBP_SUPPORTED_CACHE.value = img.width === 1
      resolve(WEBP_SUPPORTED_CACHE.value!)
    }
    img.onerror = () => {
      WEBP_SUPPORTED_CACHE.value = false
      resolve(false)
    }
    img.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

async function createImageBitmapSafe(file: File): Promise<ImageBitmap | null> {
  if (typeof window === 'undefined') return null
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: 'from-image',
        premultiplyAlpha: 'premultiply',
      })
    } catch {
      return null
    }
  }
  return null
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = (error) => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    image.src = url
  })
}

function getTargetDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let targetWidth = width
  let targetHeight = height

  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width
    const heightRatio = maxHeight / height
    const ratio = Math.min(widthRatio, heightRatio)
    targetWidth = Math.round(width * ratio)
    targetHeight = Math.round(height * ratio)
  }

  return { width: targetWidth, height: targetHeight }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

async function compressWithQualityRamp(
  canvas: HTMLCanvasElement,
  mimeType: string,
  startingQuality: number,
  targetSize: number
): Promise<{ blob: Blob; quality: number }> {
  let quality = startingQuality
  let blob = await canvasToBlob(canvas, mimeType, quality)

  if (!blob) {
    throw new Error('Failed to generate image blob')
  }

  if (blob.size <= targetSize || quality <= 0.4) {
    return { blob, quality }
  }

  const minQuality = 0.4
  const reductionStep = 0.1

  while (blob.size > targetSize && quality > minQuality) {
    quality = Math.max(minQuality, quality - reductionStep)
    const nextBlob = await canvasToBlob(canvas, mimeType, quality)
    if (!nextBlob) break
    blob = nextBlob
  }

  return { blob, quality }
}

export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  if (typeof window === 'undefined') {
    return {
      file,
      originalFile: file,
      wasCompressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    }
  }

  const { maxWidth, maxHeight, quality, targetSize, convertToWebP } = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const originalSize = file.size

  const useImageBitmap = await createImageBitmapSafe(file)
  const imageElement = useImageBitmap ? null : await loadImage(file)

  const width = useImageBitmap ? useImageBitmap.width : imageElement!.naturalWidth
  const height = useImageBitmap ? useImageBitmap.height : imageElement!.naturalHeight

  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    width,
    height,
    maxWidth,
    maxHeight
  )

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to acquire 2D context for image compression')
  }

  context.clearRect(0, 0, targetWidth, targetHeight)

  if (useImageBitmap) {
    context.drawImage(useImageBitmap, 0, 0, targetWidth, targetHeight)
    useImageBitmap.close()
  } else if (imageElement) {
    context.drawImage(imageElement, 0, 0, targetWidth, targetHeight)
  }

  const shouldUseWebP = convertToWebP && (await detectWebPSupport())
  const targetMime = shouldUseWebP ? 'image/webp' : file.type || 'image/jpeg'

  let { blob, quality: finalQuality } = await compressWithQualityRamp(
    canvas,
    targetMime,
    quality,
    targetSize
  )

  if (!blob || blob.size === 0) {
    throw new Error('Failed to compress image')
  }

  // If compression failed to shrink the file, fall back to original
  if (blob.size >= originalSize) {
    return {
      file,
      originalFile: file,
      wasCompressed: false,
      originalSize,
      compressedSize: originalSize,
    }
  }

  const extension = shouldUseWebP ? 'webp' : file.name.split('.').pop() || 'jpg'
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
  const newFileName = `${fileNameWithoutExt}.${extension}`

  const compressedFile = new File([blob], newFileName, {
    type: targetMime,
    lastModified: Date.now(),
  })

  return {
    file: compressedFile,
    originalFile: file,
    wasCompressed: true,
    originalSize,
    compressedSize: compressedFile.size,
  }
}

export async function compressImagesBatch(
  files: File[],
  options: ImageCompressionOptions = {}
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  for (const file of files) {
    try {
      const result = await compressImageFile(file, options)
      results.push(result)
    } catch (error) {
      console.error('Image compression failed, using original file', error)
      results.push({
        file,
        originalFile: file,
        wasCompressed: false,
        originalSize: file.size,
        compressedSize: file.size,
      })
    }
  }
  return results
}
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

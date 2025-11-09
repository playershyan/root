 'use client'

import { logger } from '@/lib/utils/logger'
import {
  UPLOAD_CONSTRAINTS,
  needsCompression,
  needsResize,
} from '@/lib/config/images'

export interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  targetSize?: number
  convertToWebP?: boolean
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
  wasCompressed: boolean
  wasResized: boolean
}

export interface CompressionProgress {
  fileName: string
  progress: number // 0-100
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: UPLOAD_CONSTRAINTS.targetDimensions.width,
  maxHeight: UPLOAD_CONSTRAINTS.targetDimensions.height,
  quality: UPLOAD_CONSTRAINTS.compressionQuality,
  targetSize: UPLOAD_CONSTRAINTS.targetCompressedSize,
  convertToWebP: true,
}

const WEBP_SUPPORTED_CACHE: { value?: boolean } = {}

type ImageSource = {
  width: number
  height: number
  bitmap: ImageBitmap | null
  image: HTMLImageElement | null
}

function createResult({
  file,
  originalSize,
  compressedSize,
  width,
  height,
  wasCompressed,
  wasResized,
}: {
  file: File
  originalSize: number
  compressedSize: number
  width: number
  height: number
  wasCompressed: boolean
  wasResized: boolean
}): CompressionResult {
  const safeOriginalSize = originalSize > 0 ? originalSize : compressedSize || 1
  return {
    file,
    originalSize,
    compressedSize,
    compressionRatio: compressedSize / safeOriginalSize,
    width,
    height,
    wasCompressed,
    wasResized,
  }
}

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

async function loadImageElement(file: File): Promise<HTMLImageElement> {
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

async function getImageSource(file: File): Promise<ImageSource> {
  const bitmap = await createImageBitmapSafe(file)
  if (bitmap) {
    return {
      width: bitmap.width,
      height: bitmap.height,
      bitmap,
      image: null,
    }
  }

  const image = await loadImageElement(file)
  return {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    bitmap: null,
    image,
  }
}

function getTargetDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (!width || !height) {
    return { width, height }
  }

  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const widthRatio = maxWidth / width
  const heightRatio = maxHeight / height
  const ratio = Math.min(widthRatio, heightRatio)

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
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

async function compressUsingSource(
  file: File,
  source: ImageSource,
  options: Required<ImageCompressionOptions>
): Promise<CompressionResult> {
  const { width, height } = source
  const { width: targetWidth, height: targetHeight } = getTargetDimensions(
    width,
    height,
    options.maxWidth,
    options.maxHeight
  )

  const canvasWidth = targetWidth || width
  const canvasHeight = targetHeight || height

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to acquire 2D context for image compression')
  }

  context.clearRect(0, 0, canvasWidth, canvasHeight)

  if (source.bitmap) {
    context.drawImage(source.bitmap, 0, 0, canvasWidth, canvasHeight)
  } else if (source.image) {
    context.drawImage(source.image, 0, 0, canvasWidth, canvasHeight)
  }

  const shouldUseWebP = options.convertToWebP && (await detectWebPSupport())
  const targetMime = shouldUseWebP ? 'image/webp' : file.type || 'image/jpeg'

  const { blob } = await compressWithQualityRamp(
    canvas,
    targetMime,
    options.quality,
    options.targetSize
  )

  if (!blob || blob.size === 0) {
    throw new Error('Failed to compress image')
  }

  const wasResized = canvasWidth !== width || canvasHeight !== height
  const sizeReduced = blob.size < file.size

  if (!sizeReduced && !wasResized) {
    return createResult({
      file,
      originalSize: file.size,
      compressedSize: file.size,
      width,
      height,
      wasCompressed: false,
      wasResized: false,
    })
  }

  const extension = shouldUseWebP ? 'webp' : file.name.split('.').pop() ?? 'jpg'
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
  const newFileName = `${fileNameWithoutExt}.${extension}`

  const compressedFile = new File([blob], newFileName, {
    type: targetMime,
    lastModified: Date.now(),
  })

  return createResult({
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    width: canvasWidth,
    height: canvasHeight,
    wasCompressed: sizeReduced,
    wasResized,
  })
}

export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  if (typeof window === 'undefined') {
    return createResult({
      file,
      originalSize: file.size,
      compressedSize: file.size,
      width: 0,
      height: 0,
      wasCompressed: false,
      wasResized: false,
    })
  }

  const resolvedOptions: Required<ImageCompressionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const source = await getImageSource(file)

  try {
    return await compressUsingSource(file, source, resolvedOptions)
  } finally {
    if (source.bitmap) {
      source.bitmap.close()
    }
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
      logger.error('Image compression failed, using original file', error as Error, {
        fileName: file.name,
      })
      results.push(
        createResult({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
          wasCompressed: false,
          wasResized: false,
        })
      )
    }
  }

  return results
}

export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size

  onProgress?.(10)

  if (typeof window === 'undefined') {
    onProgress?.(100)
    return createResult({
      file,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      wasCompressed: false,
      wasResized: false,
    })
  }

  let source: ImageSource | null = null

  try {
    source = await getImageSource(file)
    const { width, height } = source

    onProgress?.(30)

    const shouldCompress = needsCompression(originalSize)
    const shouldResize = needsResize(width, height)

    if (!shouldCompress && !shouldResize) {
      onProgress?.(100)
      return createResult({
        file,
        originalSize,
        compressedSize: originalSize,
        width,
        height,
        wasCompressed: false,
        wasResized: false,
      })
    }

    onProgress?.(60)

    const result = await compressUsingSource(file, source, DEFAULT_OPTIONS)

    onProgress?.(100)
    return result
  } catch (error) {
    throw new Error(
      `Failed to compress ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  } finally {
    if (source?.bitmap) {
      source.bitmap.close()
    }
  }
}

export async function compressImages(
  files: File[],
  onProgress?: (progressMap: Map<string, CompressionProgress>) => void
): Promise<CompressionResult[]> {
  const progressMap = new Map<string, CompressionProgress>()

  files.forEach((file) => {
    progressMap.set(file.name, {
      fileName: file.name,
      progress: 0,
      status: 'pending',
    })
  })

  onProgress?.(progressMap)

  const results: CompressionResult[] = []

  for (const file of files) {
    try {
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'processing',
      })
      onProgress?.(progressMap)

      const result = await compressImage(file, (progress) => {
        progressMap.set(file.name, {
          fileName: file.name,
          progress,
          status: 'processing',
        })
        onProgress?.(progressMap)
      })

      results.push(result)

      progressMap.set(file.name, {
        fileName: file.name,
        progress: 100,
        status: 'completed',
      })
      onProgress?.(progressMap)
    } catch (error) {
      progressMap.set(file.name, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onProgress?.(progressMap)

      logger.error('Image compression failed, using original file', error as Error, {
        fileName: file.name,
      })

      results.push(
        createResult({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
          wasCompressed: false,
          wasResized: false,
        })
      )
    }
  }

  return results
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!UPLOAD_CONSTRAINTS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: ${UPLOAD_CONSTRAINTS.allowedTypes.join(', ')}`,
    }
  }

  const maxServerSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxServerSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum: 10MB`,
    }
  }

  return { valid: true }
}

export function validateImageFiles(files: File[]): {
  valid: File[]
  invalid: Array<{ file: File; error: string }>
} {
  const valid: File[] = []
  const invalid: Array<{ file: File; error: string }> = []

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

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

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

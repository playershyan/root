import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Debug: Log configuration status (without exposing secrets)
console.log('🔧 Cloudinary configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
})

export interface CloudinaryUploadResult {
  success: boolean
  url?: string
  public_id?: string
  secure_url?: string
  error?: string
}

export class CloudinaryService {
  /**
   * Verify Cloudinary configuration
   */
  static isConfigured(): boolean {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )
  }

  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    file: Buffer | string,
    folder: string = 'vera-lk/listings',
    options: {
      quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number | string
      transformation?: any[]
      tags?: string[]
      fileType?: string
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      console.log('🔍 CloudinaryService.uploadImage called with:', {
        fileType: Buffer.isBuffer(file) ? 'Buffer' : typeof file,
        fileSize: Buffer.isBuffer(file) ? file.length : 'N/A',
        folder,
        options: {
          ...options,
          // Don't log the full file buffer
          fileType: options.fileType
        }
      })

      const uploadOptions: any = {
        folder,
        resource_type: 'image' as const,
        // Quality removed - handled at delivery time via URL transformations
      }
      
      // Add transformation if explicitly provided
      // Otherwise preserve original - transformations happen at delivery time
      if (options.transformation) {
        uploadOptions.transformation = options.transformation
      }
      
      // Add tags if provided
      if (options.tags) uploadOptions.tags = options.tags
      
      // IMPORTANT: Don't use format transformations during upload
      // Format optimization (f_auto) should only be used in delivery URLs

      console.log('📤 Cloudinary upload options:', uploadOptions)

      let uploadResult

      if (Buffer.isBuffer(file)) {
        // Upload buffer via stream (more efficient than base64 encoding)
        console.log('📸 Uploading Buffer via stream')
        console.log('📊 Buffer size:', file.length, 'bytes')

        // Use upload_stream for direct buffer upload without base64 overhead
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )

          // Write buffer directly to stream
          uploadStream.end(file)
        })
      } else if (typeof file === 'string') {
        console.log('📸 Uploading string (base64 or URL)')
        uploadResult = await cloudinary.uploader.upload(file, uploadOptions)
      } else {
        throw new Error('Invalid file type - only Buffer and string supported')
      }

      console.log('✅ Cloudinary upload successful:', {
        public_id: uploadResult.public_id,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height
      })

      return {
        success: true,
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      }
    } catch (error: any) {
      console.error('❌ Cloudinary upload error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        http_code: error.http_code
      })
      return {
        success: false,
        error: error.message || 'Upload failed',
      }
    }
  }

  /**
   * Upload multiple images
   */
  static async uploadMultipleImages(
    files: { buffer: Buffer; fileType: string }[],
    folder: string = 'vera-lk/listings',
    options?: Omit<Parameters<typeof CloudinaryService.uploadImage>[2], 'fileType'>
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map(file => 
      this.uploadImage(file.buffer, folder, { ...options, fileType: file.fileType })
    )
    
    return Promise.all(uploadPromises)
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return {
        success: result.result === 'ok',
      }
    } catch (error: any) {
      console.error('Cloudinary delete error:', error)
      return {
        success: false,
        error: error.message || 'Delete failed',
      }
    }
  }

  /**
   * Check if watermarks are enabled globally
   */
  static isWatermarkEnabled(): boolean {
    return process.env.CLOUDINARY_WATERMARK_ENABLED !== 'false'
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  static extractPublicIdFromUrl(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null

    const match = url.match(/\/v\d+\/(.+?)\.[^.]+$/)
    return match ? match[1] : null
  }

  /**
   * Get watermark transformation configuration
   */
  static getWatermarkTransformation(): any {
    return {
      overlay: {
        font_family: "Arial",
        font_size: 60,
        font_weight: "bold",
        text: "VERA.lk"
      },
      gravity: "south_east",
      x: 30,
      y: 30,
      opacity: 60,
      color: "white"
    }
  }

  /**
   * Add watermark transformation to existing transformation chain
   */
  static addWatermarkToTransformation(transformation: any[]): any[] {
    const watermarkTransform = this.getWatermarkTransformation()
    return [...transformation, watermarkTransform]
  }

  /**
   * Generate optimized URL for existing image with watermark
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      crop?: 'fill' | 'fit' | 'limit' | 'scale'
      quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number | string
      format?: 'auto' | 'jpg' | 'png' | 'webp'
      watermark?: boolean
    } = {}
  ): string {
    // Build transformation object
    const transformation: any = {
      width: options.width || 800,
      height: options.height || 600,
      crop: options.crop || 'limit',
      quality: options.quality || 'auto:good',
      dpr: 'auto', // Automatic device pixel ratio
    }

    // Add format if specified (f_auto for automatic format selection)
    if (options.format) {
      transformation.fetch_format = options.format
    }

    // Build transformation chain
    let transformationChain = [transformation]

    // Add watermark by default (disable with watermark: false)
    if (options.watermark !== false) {
      transformationChain = this.addWatermarkToTransformation(transformationChain)
    }

    return cloudinary.url(publicId, {
      transformation: transformationChain,
      secure: true,
    })
  }

  /**
   * Generate thumbnail URL for vera.lk listings with watermark
   * Enhanced with metadata stripping and progressive loading
   */
  static getThumbnailUrl(publicId: string, size: number = 400, watermark: boolean = true): string {
    // Build transformation chain with optimizations
    const transformation = {
      width: size,
      height: Math.round(size * 0.75), // 4:3 aspect ratio for vehicles
      crop: 'fill',
      quality: 'auto:eco', // Optimized for thumbnails
      fetch_format: 'auto',
      dpr: 'auto',
      // Add optimization flags
      flags: 'strip_profile.force_strip.progressive',
    }

    let transformationChain = [transformation]

    // Add watermark by default
    if (watermark) {
      transformationChain = this.addWatermarkToTransformation(transformationChain)
    }

    return cloudinary.url(publicId, {
      transformation: transformationChain,
      secure: true,
    })
  }

  /**
   * Generate mobile-optimized URL with watermark
   * Enhanced with metadata stripping for faster mobile delivery
   */
  static getMobileUrl(publicId: string, watermark: boolean = true): string {
    const transformation = {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:good', // Improved from eco for better mobile experience
      fetch_format: 'auto',
      dpr: 'auto',
      flags: 'strip_profile.force_strip.progressive',
    }

    let transformationChain = [transformation]

    // Add watermark by default
    if (watermark) {
      transformationChain = this.addWatermarkToTransformation(transformationChain)
    }

    return cloudinary.url(publicId, {
      transformation: transformationChain,
      secure: true,
    })
  }

  /**
   * Generate gallery URL for full-size viewing with watermark
   * Enhanced with metadata stripping and progressive loading
   */
  static getGalleryUrl(publicId: string, watermark: boolean = true): string {
    const transformation = {
      width: 1920, // Increased from 1600 for better quality on modern displays
      height: 1440,
      crop: 'limit',
      quality: 'auto:best',
      fetch_format: 'auto',
      dpr: 'auto',
      flags: 'strip_profile.force_strip.progressive',
    }

    let transformationChain = [transformation]

    // Add watermark by default
    if (watermark) {
      transformationChain = this.addWatermarkToTransformation(transformationChain)
    }

    return cloudinary.url(publicId, {
      transformation: transformationChain,
      secure: true,
    })
  }

  /**
   * Get image info
   */
  static async getImageInfo(publicId: string) {
    try {
      const result = await cloudinary.api.resource(publicId)
      return {
        success: true,
        data: result,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }
}

export default CloudinaryService
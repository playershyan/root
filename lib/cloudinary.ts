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
        quality: options.quality || 'auto:good',  // Smart quality compression
      }
      
      // Add transformation if provided, otherwise use smart defaults
      if (options.transformation) {
        uploadOptions.transformation = options.transformation
      } else {
        // Default transformations for vera.lk vehicle listings
        // Only include size/crop transformations during upload
        uploadOptions.transformation = [
          { 
            width: 1600,      // Max width for desktop viewing
            height: 1200,     // Max height to maintain quality
            crop: 'limit'     // Don't upscale smaller images
          }
        ]
      }
      
      // Add tags if provided
      if (options.tags) uploadOptions.tags = options.tags
      
      // IMPORTANT: Don't use format transformations during upload
      // Format optimization (f_auto) should only be used in delivery URLs

      console.log('📤 Cloudinary upload options:', uploadOptions)

      let uploadResult
      
      if (Buffer.isBuffer(file)) {
        // Upload buffer as base64 data URI
        const mimeType = options.fileType || 'image/jpeg'
        console.log('📸 Uploading Buffer as base64 data URI, mimeType:', mimeType)
        console.log('📊 Buffer size:', file.length, 'bytes')
        
        const dataUri = `data:${mimeType};base64,${file.toString('base64')}`
        console.log('📝 Data URI prefix:', dataUri.substring(0, 50) + '...')
        
        uploadResult = await cloudinary.uploader.upload(dataUri, uploadOptions)
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
   * Generate optimized URL for existing image
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      crop?: 'fill' | 'fit' | 'limit' | 'scale'
      quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number | string
      format?: 'auto' | 'jpg' | 'png' | 'webp'
    } = {}
  ): string {
    // Build transformation object
    const transformation: any = {
      width: options.width || 800,
      height: options.height || 600,
      crop: options.crop || 'limit',
      quality: options.quality || 'auto:good',
    }
    
    // Add format if specified (f_auto for automatic format selection)
    if (options.format) {
      transformation.fetch_format = options.format
    }
    
    return cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    })
  }

  /**
   * Generate thumbnail URL for vera.lk listings
   */
  static getThumbnailUrl(publicId: string, size: number = 400): string {
    // Build transformation chain
    const transformation = {
      width: size,
      height: Math.round(size * 0.75), // 4:3 aspect ratio for vehicles
      crop: 'fill',
      quality: 'auto:low',
      fetch_format: 'auto'  // Use fetch_format for f_auto
    }
    
    return cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    })
  }
  
  /**
   * Generate mobile-optimized URL
   */
  static getMobileUrl(publicId: string): string {
    const transformation = {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto:eco',  // Lower quality for mobile data saving
      fetch_format: 'auto'
    }
    
    return cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    })
  }
  
  /**
   * Generate gallery URL for full-size viewing
   */
  static getGalleryUrl(publicId: string): string {
    const transformation = {
      width: 1600,
      height: 1200,
      crop: 'limit',
      quality: 'auto:best',
      fetch_format: 'auto'
    }
    
    return cloudinary.url(publicId, {
      transformation: [transformation],
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
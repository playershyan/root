/**
 * Migration script to transfer all listing images from Supabase Storage to Cloudinary
 *
 * Usage: npx tsx scripts/migrate-images-to-cloudinary.ts
 */

import { config } from 'dotenv'

// IMPORTANT: Load environment variables BEFORE importing Cloudinary
// This ensures cloudinary.config() has access to env vars
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
import fetch from 'node-fetch'

// Explicitly configure Cloudinary with loaded env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

console.log('🔧 Cloudinary configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface MigrationResult {
  listingId: string
  success: boolean
  originalUrls: string[]
  cloudinaryUrls: string[]
  error?: string
}

async function migrateImages(): Promise<MigrationResult[]> {
  console.log('🚀 Starting image migration from Supabase to Cloudinary...\n')

  // Verify Cloudinary configuration
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('❌ Cloudinary is not configured. Check your environment variables.')
  }

  console.log('✅ Cloudinary configuration verified\n')

  // Fetch all listings with images
  const { data: listings, error: fetchError } = await supabase
    .from('listings')
    .select('id, image_urls, image_url, user_id')
    .not('image_urls', 'is', null)

  if (fetchError) {
    throw new Error(`Failed to fetch listings: ${fetchError.message}`)
  }

  console.log(`📊 Found ${listings?.length || 0} listings with images\n`)

  const results: MigrationResult[] = []

  for (const listing of listings || []) {
    console.log(`\n📦 Processing listing ${listing.id}...`)

    try {
      // Extract image URLs
      let imageUrls: string[] = []
      if (Array.isArray(listing.image_urls)) {
        imageUrls = listing.image_urls
      } else if (listing.image_url) {
        imageUrls = [listing.image_url]
      }

      if (imageUrls.length === 0) {
        console.log('  ⚠️  No images found, skipping...')
        continue
      }

      console.log(`  📸 Found ${imageUrls.length} images`)

      const cloudinaryUrls: string[] = []

      // Download and re-upload each image
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i]
        console.log(`  🔄 Migrating image ${i + 1}/${imageUrls.length}...`)

        try {
          // Download image from Supabase
          const response = await fetch(imageUrl)
          if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`)
          }

          const buffer = Buffer.from(await response.arrayBuffer())
          console.log(`    ✓ Downloaded (${(buffer.length / 1024).toFixed(2)} KB)`)

          // Determine file type from URL
          const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
          const mimeType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`

          // Upload to Cloudinary directly
          const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`

          const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: `vera-lk/listings/${listing.user_id}`,
            resource_type: 'image',
            quality: 'auto:good',
            transformation: [{ width: 1600, height: 1200, crop: 'limit' }],
            tags: ['migration', listing.id]
          })

          if (uploadResult.secure_url) {
            cloudinaryUrls.push(uploadResult.secure_url)
            console.log(`    ✓ Uploaded to Cloudinary: ${uploadResult.public_id}`)
          } else {
            throw new Error('Upload failed - no secure_url returned')
          }

        } catch (error: any) {
          console.error(`    ✗ Failed to migrate image: ${error.message}`)
          // Continue with next image
        }
      }

      // Update database with new URLs
      if (cloudinaryUrls.length > 0) {
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            image_urls: cloudinaryUrls,
            image_url: cloudinaryUrls[0]
          })
          .eq('id', listing.id)

        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        console.log(`  ✅ Updated database with ${cloudinaryUrls.length} Cloudinary URLs`)

        results.push({
          listingId: listing.id,
          success: true,
          originalUrls: imageUrls,
          cloudinaryUrls: cloudinaryUrls
        })
      } else {
        throw new Error('No images successfully migrated')
      }

    } catch (error: any) {
      console.error(`  ❌ Migration failed: ${error.message}`)
      results.push({
        listingId: listing.id,
        success: false,
        originalUrls: [],
        cloudinaryUrls: [],
        error: error.message
      })
    }
  }

  return results
}

// Run migration
migrateImages()
  .then(results => {
    console.log('\n\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const totalImages = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.cloudinaryUrls.length, 0)

    console.log(`✅ Successful: ${successful} listings`)
    console.log(`❌ Failed: ${failed} listings`)
    console.log(`📸 Total images migrated: ${totalImages}`)
    console.log(`🎯 Success rate: ${((successful / results.length) * 100).toFixed(1)}%`)

    if (failed > 0) {
      console.log('\n⚠️  Failed listings:')
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.listingId}: ${r.error}`))
    }

    console.log('\n✨ Migration complete!')
  })
  .catch(error => {
    console.error('\n❌ Migration failed:', error.message)
    process.exit(1)
  })

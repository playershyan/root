/**
 * Cleanup script for expired buying guides
 * Run via: node --loader ts-node/esm scripts/clean-expired-guides.ts
 *
 * This script removes guides that have exceeded their 30-day TTL
 * Should be run as a daily cron job
 */

import { cleanExpiredGuides } from '../lib/services/guideCache'

async function main() {
  console.log('Starting expired guides cleanup...')

  try {
    const deletedCount = await cleanExpiredGuides()

    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} expired guide(s)`)
    } else {
      console.log('✅ No expired guides found')
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  }
}

main().catch(console.error)

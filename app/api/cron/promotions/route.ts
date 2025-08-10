import { NextRequest, NextResponse } from 'next/server'
import { PromotionService } from '@/lib/services/promotionService'
import { RotationService } from '@/lib/services/rotationService'

// This endpoint should be called by a cron job service (like Vercel Cron, Railway Cron, or external service)
// Schedule: Every hour for expiring promotions, every day at midnight for daily boost

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (add your own auth logic)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const action = request.nextUrl.searchParams.get('action')
    
    if (action === 'expire') {
      // Expire promotions that have passed their expiry date
      await PromotionService.expirePromotions()
      
      return NextResponse.json({
        success: true,
        message: 'Expired promotions processed',
        timestamp: new Date().toISOString()
      })
    } else if (action === 'boost') {
      // Apply daily boost to boosted listings
      await PromotionService.applyDailyBoost()
      
      return NextResponse.json({
        success: true,
        message: 'Daily boost applied',
        timestamp: new Date().toISOString()
      })
    } else if (action === 'rotation') {
      // Reset rotation scores for fair distribution
      await RotationService.resetDailyRotationScores()
      
      return NextResponse.json({
        success: true,
        message: 'Rotation scores reset for fair distribution',
        timestamp: new Date().toISOString()
      })
    } else {
      // Run all operations
      await PromotionService.expirePromotions()
      await PromotionService.applyDailyBoost()
      await RotationService.resetDailyRotationScores()
      
      return NextResponse.json({
        success: true,
        message: 'All promotion and rotation maintenance tasks completed',
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to process promotions', details: error },
      { status: 500 }
    )
  }
}

// For Vercel Cron Jobs, you can also export a config
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
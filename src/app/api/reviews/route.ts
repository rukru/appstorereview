import { NextRequest, NextResponse } from 'next/server'
import { ReviewService } from '@/lib/services/reviewService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    const platform = searchParams.get('platform') as 'appstore' | 'googleplay'
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    if (!appId || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: appId and platform' },
        { status: 400 }
      )
    }

    if (platform !== 'appstore' && platform !== 'googleplay') {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "appstore" or "googleplay"' },
        { status: 400 }
      )
    }

    console.log(`📍 Fetching reviews for ${appId} (${platform}) from all regions`)

    const result = await ReviewService.getReviews(appId, platform, forceRefresh)

    return NextResponse.json({
      reviews: result.reviews,
      totalCount: result.totalCount,
      averageRating: result.averageRating,
      fromCache: result.fromCache
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

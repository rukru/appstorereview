import { NextRequest, NextResponse } from 'next/server'
import { parseAppStoreReviews } from '@/lib/parsers/appstore'
import { parseGooglePlayReviews } from '@/lib/parsers/googleplay'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    const platform = searchParams.get('platform') as 'appstore' | 'googleplay'

    if (!appId || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: appId and platform' },
        { status: 400 }
      )
    }

    let result

    if (platform === 'appstore') {
      result = await parseAppStoreReviews(appId)
    } else if (platform === 'googleplay') {
      result = await parseGooglePlayReviews(appId)
    } else {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "appstore" or "googleplay"' },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

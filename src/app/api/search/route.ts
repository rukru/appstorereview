import { NextRequest, NextResponse } from 'next/server'
import { searchAppStoreApp } from '@/lib/parsers/appstore'
import { searchGooglePlayApp } from '@/lib/parsers/googleplay'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const platform = searchParams.get('platform') as 'appstore' | 'googleplay'

    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query parameter: q' },
        { status: 400 }
      )
    }

    if (!platform || (platform !== 'appstore' && platform !== 'googleplay')) {
      return NextResponse.json(
        { error: 'Invalid or missing platform. Must be "appstore" or "googleplay"' },
        { status: 400 }
      )
    }

    console.log(`Searching ${platform} for: ${query}`)

    let results
    if (platform === 'appstore') {
      results = await searchAppStoreApp(query)
    } else {
      results = await searchGooglePlayApp(query)
    }

    console.log(`Found ${results.length} results for ${query} on ${platform}`)

    return NextResponse.json({
      results,
      platform,
      query,
    })
  } catch (error) {
    console.error('Error searching apps:', error)
    return NextResponse.json(
      { error: `Failed to search apps: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
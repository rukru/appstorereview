import { NextRequest, NextResponse } from 'next/server'
import { search as playStoreSearch } from 'google-play-scraper'

interface AppStoreApp {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string
  primaryGenreName: string
  averageUserRating: number
  userRatingCount: number
  description: string
}

interface GooglePlayApp {
  appId: string
  title: string
  developer: string
  icon: string
  genre: string
  score: number
  reviews: number
  summary: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const platform = searchParams.get('platform') as 'appstore' | 'googleplay'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    if (!platform || !['appstore', 'googleplay'].includes(platform)) {
      return NextResponse.json({ error: 'Platform must be appstore or googleplay' }, { status: 400 })
    }

    let results: any[] = []

    if (platform === 'appstore') {
      // iTunes Search API
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=software&country=us&limit=${limit}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to search App Store')
      }

      const data = await response.json()
      
      results = data.results.map((app: AppStoreApp) => ({
        id: app.trackId.toString(),
        name: app.trackName,
        developer: app.artistName,
        icon: app.artworkUrl100,
        category: app.primaryGenreName,
        rating: app.averageUserRating || 0,
        reviewCount: app.userRatingCount || 0,
        description: app.description || '',
        platform: 'appstore'
      }))
    } else {
      // Google Play Search
      try {
        const apps = await playStoreSearch({
          term: query,
          num: limit,
          country: 'us',
          lang: 'en'
        })

        results = apps.map((app: GooglePlayApp) => ({
          id: app.appId,
          name: app.title,
          developer: app.developer,
          icon: app.icon,
          category: app.genre,
          rating: app.score || 0,
          reviewCount: app.reviews || 0,
          description: app.summary || '',
          platform: 'googleplay'
        }))
      } catch (error) {
        console.error('Google Play search error:', error)
        // Fallback: return empty results instead of throwing error
        results = []
      }
    }

    return NextResponse.json({ 
      results,
      query,
      platform,
      total: results.length
    })

  } catch (error) {
    console.error('App search error:', error)
    return NextResponse.json(
      { error: 'Failed to search apps' },
      { status: 500 }
    )
  }
}
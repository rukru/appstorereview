import { NextRequest, NextResponse } from 'next/server'
const gplay = require('google-play-scraper')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')
    const platform = searchParams.get('platform')

    if (!appId || !platform) {
      return NextResponse.json(
        { error: 'Missing appId or platform' },
        { status: 400 }
      )
    }

    let appInfo = null

    if (platform === 'appstore') {
      // Получаем информацию из App Store
      try {
        const response = await fetch(
          `https://itunes.apple.com/lookup?id=${appId}&country=us`
        )
        const data = await response.json()
        
        if (data.results && data.results.length > 0) {
          const app = data.results[0]
          appInfo = {
            name: app.trackName,
            icon: app.artworkUrl100,
            bundleId: app.bundleId,
            description: app.description,
            averageRating: app.averageUserRating,
            ratingCount: app.userRatingCount
          }
        }
      } catch (error) {
        console.error('Error fetching App Store info:', error)
      }
    } else if (platform === 'googleplay') {
      // Получаем информацию из Google Play
      try {
        const app = await gplay.default.app({ appId })
        
        appInfo = {
          name: app.title,
          icon: app.icon,
          bundleId: app.appId,
          description: app.summary || app.description,
          averageRating: app.score,
          ratingCount: app.reviews
        }
      } catch (error) {
        console.error('Error fetching Google Play info:', error)
        // Fallback к базовой информации
        appInfo = {
          name: appId, // Используем package name как название
          icon: null,
          bundleId: appId,
          description: null,
          averageRating: null,
          ratingCount: null
        }
      }
    }

    return NextResponse.json(appInfo || {
      name: appId,
      icon: null,
      bundleId: appId,
      description: null,
      averageRating: null,
      ratingCount: null
    })
  } catch (error) {
    console.error('Error fetching app info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch app info' },
      { status: 500 }
    )
  }
}
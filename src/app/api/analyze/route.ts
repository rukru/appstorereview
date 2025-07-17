import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/lib/services/analysisService'
import { analyzeReviews } from '@/lib/api/openai'
import { Review } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support both new API (with appId/platform) and legacy API (with reviews array)
    if (body.appId && body.platform) {
      // New API: Use database and caching
      const { appId, platform, dateFilter, forceRefresh } = body

      if (platform !== 'appstore' && platform !== 'googleplay') {
        return NextResponse.json(
          { error: 'Platform must be either "appstore" or "googleplay"' },
          { status: 400 }
        )
      }

      const validDateFilters = ['7days', '30days', '90days', 'all']
      if (dateFilter && !validDateFilters.includes(dateFilter)) {
        return NextResponse.json(
          { error: 'Invalid dateFilter. Must be one of: ' + validDateFilters.join(', ') },
          { status: 400 }
        )
      }

      // If forceRefresh = true, use short cache (1 minute)
      const maxAge = forceRefresh ? 60 * 1000 : 24 * 60 * 60 * 1000

      const analysis = await AnalysisService.getOrCreateAnalysis(
        appId,
        platform,
        dateFilter || 'all',
        maxAge
      )

      return NextResponse.json(analysis)
    } else if (body.reviews) {
      // Legacy API: Direct analysis with optional database save
      const { reviews, appId, platform, dateFilter } = body as { 
        reviews: Review[]
        appId?: string
        platform?: 'appstore' | 'googleplay'
        dateFilter?: string
      }

      if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
        return NextResponse.json(
          { error: 'Missing or empty reviews array' },
          { status: 400 }
        )
      }

      // Limit to first 50 reviews for analysis to avoid token limits
      const reviewsToAnalyze = reviews.slice(0, 50)
      
      // Если есть appId и platform, используем новый метод с сохранением
      if (appId && platform) {
        const analysis = await AnalysisService.createAnalysisFromReviews(
          reviewsToAnalyze,
          appId,
          platform,
          dateFilter || 'all'
        )
        return NextResponse.json(analysis)
      } else {
        // Иначе используем старый метод без сохранения
        const analysis = await analyzeReviews(reviewsToAnalyze)
        return NextResponse.json(analysis)
      }
    } else {
      return NextResponse.json(
        { error: 'Either appId/platform or reviews array is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error analyzing reviews:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reviews' },
      { status: 500 }
    )
  }
}
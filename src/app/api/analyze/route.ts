import { NextRequest, NextResponse } from 'next/server'
import { analyzeReviews } from '@/lib/api/openai'
import { Review } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviews } = body as { reviews: Review[] }

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty reviews array' },
        { status: 400 }
      )
    }

    // Limit to first 50 reviews for analysis to avoid token limits
    const reviewsToAnalyze = reviews.slice(0, 50)

    const analysis = await analyzeReviews(reviewsToAnalyze)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing reviews:', error)
    return NextResponse.json(
      { error: 'Failed to analyze reviews' },
      { status: 500 }
    )
  }
}

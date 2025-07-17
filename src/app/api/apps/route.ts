import { NextRequest, NextResponse } from 'next/server'
import { ReviewService } from '@/lib/services/reviewService'
import { AnalysisService } from '@/lib/services/analysisService'

export async function GET(request: NextRequest) {
  try {
    const apps = await ReviewService.getApps()
    return NextResponse.json(apps)
  } catch (error) {
    console.error('Error fetching apps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch apps' },
      { status: 500 }
    )
  }
}
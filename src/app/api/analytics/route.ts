import { NextRequest, NextResponse } from 'next/server'
import { AnalysisService } from '@/lib/services/analysisService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('appId')

    if (appId) {
      // Get analytics for specific app
      const comparison = await AnalysisService.compareAnalyses(appId)
      const history = await AnalysisService.getAnalysisHistory(appId)
      
      return NextResponse.json({
        comparison,
        history
      })
    } else {
      // Get global analytics
      const stats = await AnalysisService.getAnalyticsStats()
      return NextResponse.json(stats)
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
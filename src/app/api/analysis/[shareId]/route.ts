import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing shareId parameter' },
        { status: 400 }
      )
    }

    // Найти анализ по shareId
    const analysis = await prisma.analysis.findFirst({
      where: {
        shareId: shareId,
        isPublic: true // Только публичные анализы
      },
      include: {
        app: {
          select: {
            appId: true,
            platform: true,
            name: true
          }
        }
      }
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found or not public' },
        { status: 404 }
      )
    }

    // Преобразуем данные для фронтенда
    const result = {
      id: analysis.id,
      shareId: analysis.shareId,
      appId: analysis.appId,
      platform: analysis.app.platform.toLowerCase(),
      appName: analysis.app.name,
      dateFilter: analysis.dateFilter,
      reviewsCount: analysis.reviewsCount,
      
      // Результаты анализа
      sentiment: analysis.sentiment,
      themes: analysis.themes,
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      score: analysis.score,
      problems: analysis.problems,
      appreciatedFeatures: analysis.appreciatedFeatures,
      featureRequests: analysis.featureRequests,
      reviewsAnalyzed: analysis.reviewsAnalyzed,
      
      // Метаданные
      openaiModel: analysis.openaiModel,
      processingTime: analysis.processingTime,
      createdAt: analysis.createdAt.toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching analysis:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to fetch analysis', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// API для публикации анализа (изменение статуса isPublic)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const body = await request.json()
    const { isPublic } = body

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing shareId parameter' },
        { status: 400 }
      )
    }

    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'isPublic must be a boolean' },
        { status: 400 }
      )
    }

    // Обновить статус публичности анализа
    const analysis = await prisma.analysis.update({
      where: {
        shareId: shareId
      },
      data: {
        isPublic: isPublic
      }
    })

    return NextResponse.json({
      shareId: analysis.shareId,
      isPublic: analysis.isPublic,
      message: isPublic ? 'Analysis made public' : 'Analysis made private'
    })
  } catch (error) {
    console.error('Error updating analysis:', error)
    return NextResponse.json(
      { error: 'Failed to update analysis' },
      { status: 500 }
    )
  }
}
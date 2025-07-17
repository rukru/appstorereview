import { prisma } from '@/lib/db'
import { Analysis, Platform } from '@prisma/client'
import { analyzeReviews } from '@/lib/api/openai'
import { ReviewService } from './reviewService'
import { AnalysisResult } from '@/types'

export interface AnalysisWithShare extends AnalysisResult {
  shareId?: string
  isPublic?: boolean
}

export class AnalysisService {
  // Получить или создать анализ с кэшированием
  static async getOrCreateAnalysis(
    appId: string,
    platform: 'appstore' | 'googleplay',
    dateFilter: '7days' | '30days' | '90days' | 'all',
    maxAge = 24 * 60 * 60 * 1000 // 24 часа по умолчанию
  ): Promise<AnalysisWithShare> {
    const platformEnum = platform === 'appstore' ? Platform.APPSTORE : Platform.GOOGLEPLAY

    // Ищем свежий анализ
    const cacheThreshold = new Date(Date.now() - maxAge)
    const recentAnalysis = await prisma.analysis.findFirst({
      where: {
        appId,
        dateFilter,
        createdAt: { gte: cacheThreshold }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentAnalysis) {
      return this.convertToAnalysisWithShare(recentAnalysis)
    }

    // Создаем новый анализ
    const startTime = Date.now()
    
    // Получаем отфильтрованные отзывы
    const reviews = await ReviewService.getFilteredReviews(appId, platform, dateFilter)
    
    if (reviews.length === 0) {
      throw new Error('No reviews found for analysis')
    }

    // Анализируем отзывы с помощью OpenAI
    const analysisResult = await analyzeReviews(reviews.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      rating: r.rating,
      author: r.author,
      date: r.date,
      platform: platform,
      appId: r.appId,
      version: r.version || undefined
    })))

    const processingTime = Date.now() - startTime

    // Сохраняем анализ в БД
    const savedAnalysis = await prisma.analysis.create({
      data: {
        appId,
        dateFilter,
        reviewsCount: reviews.length,
        sentiment: analysisResult.sentiment,
        themes: analysisResult.themes,
        summary: analysisResult.summary,
        recommendations: analysisResult.recommendations,
        score: analysisResult.score,
        problems: analysisResult.problems as any,
        appreciatedFeatures: analysisResult.appreciatedFeatures as any,
        featureRequests: analysisResult.featureRequests as any,
        reviewsAnalyzed: analysisResult.reviewsAnalyzed,
        processingTime
      }
    })

    return this.convertToAnalysisWithShare(savedAnalysis)
  }

  // Получить историю анализов для приложения
  static async getAnalysisHistory(
    appId: string,
    dateFilter?: string,
    limit = 10
  ) {
    return await prisma.analysis.findMany({
      where: {
        appId,
        ...(dateFilter && { dateFilter })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Сравнить анализы разных периодов
  static async compareAnalyses(appId: string) {
    const analyses = await prisma.analysis.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
      take: 4 // Последние 4 анализа
    })

    return {
      current: analyses[0] || null,
      previous: analyses[1] || null,
      trend: analyses.length >= 2 ? {
        scoreChange: analyses[0].score - analyses[1].score,
        sentimentChange: analyses[0].sentiment !== analyses[1].sentiment
      } : null,
      history: analyses
    }
  }

  // Получить статистику по всем анализам
  static async getAnalyticsStats() {
    const totalAnalyses = await prisma.analysis.count()
    const totalApps = await prisma.app.count()
    const totalReviews = await prisma.review.count()
    
    const avgScore = await prisma.analysis.aggregate({
      _avg: { score: true }
    })

    const sentimentDistribution = await prisma.analysis.groupBy({
      by: ['sentiment'],
      _count: { sentiment: true }
    })

    const recentAnalyses = await prisma.analysis.findMany({
      include: {
        app: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return {
      totalAnalyses,
      totalApps,
      totalReviews,
      averageScore: Math.round((avgScore._avg.score || 0) * 10) / 10,
      sentimentDistribution,
      recentAnalyses
    }
  }

  // Создать публичную ссылку для анализа
  static async makeAnalysisPublic(analysisId: string): Promise<string> {
    const analysis = await prisma.analysis.update({
      where: { id: analysisId },
      data: { isPublic: true }
    })
    return analysis.shareId
  }

  // Сделать анализ приватным
  static async makeAnalysisPrivate(analysisId: string): Promise<void> {
    await prisma.analysis.update({
      where: { id: analysisId },
      data: { isPublic: false }
    })
  }

  // Получить анализ по shareId (только публичные)
  static async getPublicAnalysis(shareId: string): Promise<AnalysisWithShare | null> {
    const analysis = await prisma.analysis.findUnique({
      where: {
        shareId,
        isPublic: true
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
      return null
    }

    return this.convertToAnalysisWithShare(analysis)
  }

  // Создать новый анализ напрямую (для legacy API)
  static async createAnalysisFromReviews(
    reviews: any[],
    appId?: string,
    platform?: 'appstore' | 'googleplay',
    dateFilter = 'all'
  ): Promise<AnalysisWithShare> {
    const startTime = Date.now()
    
    // Анализируем отзывы с помощью OpenAI
    const analysisResult = await analyzeReviews(reviews)
    const processingTime = Date.now() - startTime

    // Если есть appId, сохраняем в БД
    if (appId && platform) {
      const savedAnalysis = await prisma.analysis.create({
        data: {
          appId,
          dateFilter,
          reviewsCount: reviews.length,
          sentiment: analysisResult.sentiment,
          themes: analysisResult.themes,
          summary: analysisResult.summary,
          recommendations: analysisResult.recommendations,
          score: analysisResult.score,
          problems: analysisResult.problems as any,
          appreciatedFeatures: analysisResult.appreciatedFeatures as any,
          featureRequests: analysisResult.featureRequests as any,
          reviewsAnalyzed: analysisResult.reviewsAnalyzed,
          processingTime,
          isPublic: true // По умолчанию новые анализы публичные
        }
      })

      return this.convertToAnalysisWithShare(savedAnalysis)
    }

    // Если нет appId, возвращаем результат без сохранения
    return {
      ...analysisResult,
      shareId: undefined,
      isPublic: false
    }
  }

  // Приватная функция для конвертации Analysis в AnalysisWithShare
  private static convertToAnalysisWithShare(analysis: Analysis & { app?: any }): AnalysisWithShare {
    return {
      sentiment: analysis.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
      themes: analysis.themes,
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      score: analysis.score,
      problems: analysis.problems as any,
      appreciatedFeatures: (analysis as any).appreciatedFeatures || [],
      featureRequests: (analysis as any).featureRequests || [],
      reviewsAnalyzed: (analysis as any).reviewsAnalyzed || 0,
      shareId: (analysis as any).shareId,
      isPublic: (analysis as any).isPublic
    }
  }

  // Приватная функция для конвертации Analysis в AnalysisResult (обратная совместимость)
  private static convertToAnalysisResult(analysis: Analysis): AnalysisResult {
    return {
      sentiment: analysis.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
      themes: analysis.themes,
      summary: analysis.summary,
      recommendations: analysis.recommendations,
      score: analysis.score,
      problems: analysis.problems as any,
      appreciatedFeatures: (analysis as any).appreciatedFeatures || [],
      featureRequests: (analysis as any).featureRequests || [],
      reviewsAnalyzed: (analysis as any).reviewsAnalyzed || 0
    }
  }
}
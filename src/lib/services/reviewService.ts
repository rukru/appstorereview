import { prisma } from '@/lib/db'
import { Review as DbReview, Platform } from '@prisma/client'
import { Review } from '@/types'
import { parseAppStoreReviews, parseAppStoreReviewsAllRegions, parseAppStoreReviewsFromRegions } from '@/lib/parsers/appstore'
import { parseGooglePlayReviews } from '@/lib/parsers/googleplay'

export interface ReviewServiceResult {
  reviews: Review[]
  totalCount: number
  averageRating: number
  fromCache: boolean
}

// Функция для нормализации текста отзыва для сравнения
function normalizeReviewContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Удаляем знаки пунктуации
    .replace(/\s+/g, ' ') // Нормализуем пробелы
    .trim()
    .substring(0, 200) // Берем первые 200 символов для сравнения
}

// Helper function to convert DB review to frontend review
function convertDbReviewToFrontend(review: DbReview): Review {
  return {
    id: review.id,
    title: review.title,
    content: review.content,
    rating: review.rating,
    author: review.author,
    date: review.date.toISOString(),
    platform: review.platform.toLowerCase() as 'appstore' | 'googleplay',
    appId: review.appId,
    version: review.version || undefined,
    helpful: review.helpful || undefined
  }
}

// Helper function to deduplicate reviews by content
function deduplicateReviewsByContent(reviews: Review[]): Review[] {
  const seenContentHashes = new Set<string>()
  const uniqueReviews: Review[] = []
  
  for (const review of reviews) {
    const normalizedContent = normalizeReviewContent(review.content)
    const contentHash = `${normalizedContent}_${review.author}_${review.rating}`
    
    if (!seenContentHashes.has(contentHash)) {
      seenContentHashes.add(contentHash)
      uniqueReviews.push(review)
    }
  }
  
  return uniqueReviews
}

export class ReviewService {
  // Получить отзывы с кэшированием
  static async getReviews(
    appId: string, 
    platform: 'appstore' | 'googleplay',
    forceRefresh = false,
    geoScope: 'single' | 'major' | 'all' | 'americas' | 'europe' | 'asia' | 'english' = 'major'
  ): Promise<ReviewServiceResult> {
    const platformEnum = platform === 'appstore' ? Platform.APPSTORE : Platform.GOOGLEPLAY
    
    // Сначала проверяем, есть ли отзывы в БД для этого приложения с учетом geoScope
    const existingReviews = await prisma.review.findMany({
      where: {
        appId,
        platform: platformEnum,
        // Для App Store учитываем geoScope, для Google Play - игнорируем
        // ВАЖНО: Для совместимости с существующими данными (которые имеют geoScope: null)
        ...(platform === 'appstore' && geoScope !== 'all' ? { 
          OR: [
            { geoScope },
            { geoScope: null } // Старые данные без geoScope
          ]
        } : platform === 'appstore' && geoScope === 'all' ? {
          // Для 'all' - берем все отзывы независимо от geoScope
        } : {})
      },
      orderBy: { date: 'desc' }
    })

    // Если есть отзывы и не принудительное обновление, проверяем возраст последнего отзыва
    if (!forceRefresh && existingReviews.length > 0) {
      const latestReview = existingReviews[0]
      const cacheThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 часа (увеличен интервал)
      
      console.log(`🔍 Found ${existingReviews.length} existing reviews for ${appId} (${platform}, geoScope: ${geoScope})`)
      console.log(`📅 Latest review created: ${latestReview.createdAt}, threshold: ${cacheThreshold}`)
      
      // Для обратной совместимости: если у нас есть достаточно отзывов с geoScope: null,
      // и запрашиваем major/single/all - используем кэш
      const hasLegacyData = existingReviews.some(r => r.geoScope === null)
      const isCompatibleScope = ['major', 'single', 'all'].includes(geoScope)
      
      // Если последний отзыв был добавлен недавно, возвращаем кэш
      // Для legacy данных (geoScope: null) - всегда используем кэш, если есть достаточно отзывов
      const shouldUseCache = latestReview.createdAt >= cacheThreshold || 
                            (hasLegacyData && isCompatibleScope && existingReviews.length >= 50)
      
      console.log(`🔄 Cache decision: shouldUseCache=${shouldUseCache}, hasLegacyData=${hasLegacyData}, isCompatibleScope=${isCompatibleScope}, reviewCount=${existingReviews.length}`)
      
      if (shouldUseCache) {
        console.log(`📋 Loading ${existingReviews.length} reviews from cache for ${appId} (${platform}, geoScope: ${geoScope})`)
        
        const totalRating = existingReviews.reduce((sum, review) => sum + review.rating, 0)
        
        // Конвертируем типы для фронтенда и удаляем дубликаты
        const convertedReviews = existingReviews.map(convertDbReviewToFrontend)
        const uniqueReviews = deduplicateReviewsByContent(convertedReviews)
        
        return {
          reviews: uniqueReviews,
          totalCount: uniqueReviews.length,
          averageRating: Math.round((totalRating / existingReviews.length) * 10) / 10,
          fromCache: true
        }
      } else {
        console.log(`⏰ Cache expired or insufficient data, fetching new reviews for ${appId} (${platform}, geoScope: ${geoScope})`)
      }
    } else {
      console.log(`🔄 No existing reviews or force refresh for ${appId} (${platform}, geoScope: ${geoScope})`)
    }

    // Парсим новые отзывы с учетом географической области
    console.log(`🌍 Starting review collection for ${appId} (${platform}, geoScope: ${geoScope})`)
    let parsedReviews: any
    
    if (platform === 'appstore') {
      switch (geoScope) {
        case 'all':
          console.log('📍 Collecting from ALL regions (15 countries)')
          parsedReviews = await parseAppStoreReviewsAllRegions(appId)
          break
        case 'americas':
        case 'europe':
        case 'asia':
        case 'english':
          console.log(`📍 Collecting from ${geoScope.toUpperCase()} region`)
          parsedReviews = await parseAppStoreReviewsFromRegions(appId, [geoScope])
          break
        case 'major':
          console.log('📍 Collecting from MAJOR countries (RU, US, GB, DE, FR, JP)')
          parsedReviews = await parseAppStoreReviews(appId, ['ru', 'us', 'gb', 'de', 'fr', 'jp'])
          break
        case 'single':
        default:
          console.log('📍 Collecting from RUSSIA only')
          parsedReviews = await parseAppStoreReviews(appId, ['ru'])
          break
      }
    } else {
      console.log('📍 Collecting from Google Play (RU)')
      // Google Play всегда использует одну страну (ru)
      parsedReviews = await parseGooglePlayReviews(appId)
    }
    
    console.log(`✅ Collection completed: ${parsedReviews.totalCount} reviews collected`)

    // Сохраняем приложение и отзывы
    await this.saveApp(appId, platformEnum)
    
    // Только сохраняем новые отзывы (не дублируем существующие)
    const newReviews = await this.saveReviews(appId, platformEnum, parsedReviews.reviews, geoScope)
    
    // Получаем все отзывы из БД (включая старые и новые) с учетом geoScope
    const allReviews = await prisma.review.findMany({
      where: { 
        appId, 
        platform: platformEnum,
        // Для App Store учитываем geoScope, для Google Play - игнорируем
        // ВАЖНО: Для совместимости с существующими данными (которые имеют geoScope: null)
        ...(platform === 'appstore' && geoScope !== 'all' ? { 
          OR: [
            { geoScope },
            { geoScope: null } // Старые данные без geoScope
          ]
        } : platform === 'appstore' && geoScope === 'all' ? {
          // Для 'all' - берем все отзывы независимо от geoScope
        } : {})
      },
      orderBy: { date: 'desc' }
    })

    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0)

    // Конвертируем типы для фронтенда и удаляем дубликаты
    const convertedReviews = allReviews.map(convertDbReviewToFrontend)
    const uniqueReviews = deduplicateReviewsByContent(convertedReviews)

    return {
      reviews: uniqueReviews,
      totalCount: uniqueReviews.length,
      averageRating: Math.round((totalRating / allReviews.length) * 10) / 10,
      fromCache: false
    }
  }

  // Сохранить приложение
  private static async saveApp(appId: string, platform: Platform) {
    await prisma.app.upsert({
      where: { appId },
      create: {
        appId,
        platform,
        name: null,
        bundleId: null
      },
      update: {
        updatedAt: new Date()
      }
    })
  }

  // Сохранить отзывы
  private static async saveReviews(
    appId: string, 
    platform: Platform, 
    reviews: any[],
    geoScope?: string
  ): Promise<number> {
    let newReviewsCount = 0
    
    for (const review of reviews) {
      try {
        const result = await prisma.review.upsert({
          where: {
            originalId_platform_appId: {
              originalId: review.id,
              platform,
              appId
            }
          },
          create: {
            originalId: review.id,
            appId,
            platform,
            title: review.title,
            content: review.content,
            rating: review.rating,
            author: review.author,
            date: new Date(review.date),
            version: review.version,
            helpful: review.helpful,
            geoScope: platform === 'APPSTORE' ? geoScope : null
          },
          update: {} // Не обновляем существующие отзывы
        })
        
        // Если создали новый отзыв (а не обновили), увеличиваем счетчик
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          newReviewsCount++
        }
      } catch (error) {
        console.warn(`Failed to save review ${review.id}:`, error)
        // Продолжаем сохранение других отзывов
      }
    }
    
    return newReviewsCount
  }

  // Получить отзывы с фильтрацией по дате
  static async getFilteredReviews(
    appId: string,
    platform: 'appstore' | 'googleplay',
    dateFilter: '7days' | '30days' | '90days' | 'all'
  ): Promise<Review[]> {
    const platformEnum = platform === 'appstore' ? Platform.APPSTORE : Platform.GOOGLEPLAY
    
    let dateThreshold: Date | undefined
    if (dateFilter !== 'all') {
      const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90
      dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    }

    const dbReviews = await prisma.review.findMany({
      where: {
        appId,
        platform: platformEnum,
        ...(dateThreshold && { date: { gte: dateThreshold } })
      },
      orderBy: { date: 'desc' }
    })

    // Конвертируем типы для фронтенда и удаляем дубликаты
    const convertedReviews = dbReviews.map(convertDbReviewToFrontend)
    return deduplicateReviewsByContent(convertedReviews)
  }

  // Получить список всех приложений
  static async getApps() {
    return await prisma.app.findMany({
      include: {
        _count: {
          select: {
            reviews: true,
            analyses: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }
}
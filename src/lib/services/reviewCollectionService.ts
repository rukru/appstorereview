import { prisma } from '@/lib/db'
import { Platform } from '@prisma/client'
import { parseAppStoreReviewsComplete, parseAppStoreReviewsIncremental } from '@/lib/parsers/appstore-enhanced'
import { parseAppStoreReviewsAllRegions } from '@/lib/parsers/appstore'

export interface CollectionJob {
  id: string
  appId: string
  platform: 'appstore' | 'googleplay'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  totalCountries: number
  completedCountries: number
  reviewsCollected: number
  errors: string[]
  startedAt?: Date
  completedAt?: Date
  estimatedTimeRemaining?: number
}

export interface CollectionStrategy {
  type: 'complete' | 'incremental' | 'targeted'
  countries?: string[]
  maxPagesPerCountry?: number
  respectRateLimit: boolean
  pauseOnErrors: boolean
}

class ReviewCollectionManager {
  private static activeJobs = new Map<string, CollectionJob>()
  
  // Создать новую задачу сбора
  static async createCollectionJob(
    appId: string,
    platform: 'appstore' | 'googleplay',
    strategy: CollectionStrategy = { type: 'complete', respectRateLimit: true, pauseOnErrors: false }
  ): Promise<string> {
    const jobId = `${platform}_${appId}_${Date.now()}`
    
    const job: CollectionJob = {
      id: jobId,
      appId,
      platform,
      status: 'pending',
      progress: 0,
      totalCountries: strategy.countries?.length || 15,
      completedCountries: 0,
      reviewsCollected: 0,
      errors: [],
      startedAt: new Date()
    }
    
    this.activeJobs.set(jobId, job)
    
    // Запускаем сбор асинхронно
    this.executeCollectionJob(jobId, strategy).catch(error => {
      console.error(`Collection job ${jobId} failed:`, error)
      const failedJob = this.activeJobs.get(jobId)
      if (failedJob) {
        failedJob.status = 'failed'
        failedJob.errors.push(error.message)
        failedJob.completedAt = new Date()
      }
    })
    
    return jobId
  }
  
  // Выполнить задачу сбора
  private static async executeCollectionJob(jobId: string, strategy: CollectionStrategy) {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }
    
    try {
      job.status = 'running'
      console.log(`🚀 Starting collection job ${jobId}`)
      
      let result: any
      
      if (job.platform === 'appstore') {
        if (strategy.type === 'complete') {
          // Полный сбор со всех регионов
          result = await parseAppStoreReviewsComplete(
            job.appId,
            strategy.countries as any,
            (progress) => {
              // Обновляем прогресс
              job.progress = progress.totalProgress
              job.completedCountries = Math.round((progress.totalProgress / 100) * job.totalCountries)
              job.reviewsCollected = progress.reviewsCount
              
              console.log(`📊 Job ${jobId} progress: ${progress.totalProgress}% (${progress.country}: ${progress.reviewsCount} reviews)`)
            }
          )
        } else if (strategy.type === 'incremental') {
          // Инкрементальный сбор
          result = await parseAppStoreReviewsIncremental(
            job.appId,
            strategy.countries as any,
            strategy.maxPagesPerCountry
          )
        } else {
          // Стандартный сбор (совместимость)
          result = await parseAppStoreReviewsAllRegions(job.appId)
        }
      } else {
        throw new Error('Google Play complete collection not implemented yet')
      }
      
      // Сохраняем результаты
      await this.saveCollectionResults(job.appId, job.platform, result.reviews)
      
      // Обновляем статус задачи
      job.status = 'completed'
      job.progress = 100
      job.reviewsCollected = result.totalCount
      job.completedAt = new Date()
      
      console.log(`✅ Collection job ${jobId} completed: ${result.totalCount} reviews collected`)
      
      // Сохраняем статистику в базу данных
      await this.saveJobStats(job, result.collectionStats)
      
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')
      job.completedAt = new Date()
      
      console.error(`❌ Collection job ${jobId} failed:`, error)
      throw error
    }
  }
  
  // Сохранить результаты сбора
  private static async saveCollectionResults(
    appId: string,
    platform: 'appstore' | 'googleplay',
    reviews: any[]
  ) {
    const platformEnum = platform === 'appstore' ? Platform.APPSTORE : Platform.GOOGLEPLAY
    
    // Сохраняем приложение
    await prisma.app.upsert({
      where: { appId },
      create: {
        appId,
        platform: platformEnum,
        name: null,
        bundleId: null
      },
      update: {
        updatedAt: new Date()
      }
    })
    
    // Сохраняем отзывы
    let savedCount = 0
    for (const review of reviews) {
      try {
        const result = await prisma.review.upsert({
          where: {
            originalId_platform_appId: {
              originalId: review.id,
              platform: platformEnum,
              appId
            }
          },
          create: {
            originalId: review.id,
            appId,
            platform: platformEnum,
            title: review.title,
            content: review.content,
            rating: review.rating,
            author: review.author,
            date: new Date(review.date),
            version: review.version,
            helpful: review.helpful,
            geoScope: platform === 'appstore' ? 'complete' : null // Помечаем как полный сбор
          },
          update: {}
        })
        
        if (result.createdAt.getTime() === result.updatedAt.getTime()) {
          savedCount++
        }
      } catch (error) {
        console.warn(`Failed to save review ${review.id}:`, error)
      }
    }
    
    console.log(`💾 Saved ${savedCount} new reviews out of ${reviews.length} total`)
  }
  
  // Сохранить статистику задачи
  private static async saveJobStats(job: CollectionJob, stats: any) {
    try {
      // Можно создать отдельную таблицу для статистики сбора
      console.log(`📈 Collection stats for job ${job.id}:`, {
        appId: job.appId,
        platform: job.platform,
        duration: job.completedAt ? 
          (job.completedAt.getTime() - job.startedAt!.getTime()) / 1000 : 0,
        reviewsCollected: job.reviewsCollected,
        errors: job.errors.length,
        ...stats
      })
    } catch (error) {
      console.warn('Failed to save job stats:', error)
    }
  }
  
  // Получить статус задачи
  static getJobStatus(jobId: string): CollectionJob | null {
    return this.activeJobs.get(jobId) || null
  }
  
  // Получить все активные задачи
  static getActiveJobs(): CollectionJob[] {
    return Array.from(this.activeJobs.values())
  }
  
  // Приостановить задачу
  static pauseJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job && job.status === 'running') {
      job.status = 'paused'
      return true
    }
    return false
  }
  
  // Отменить задачу
  static cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.status = 'failed'
      job.errors.push('Cancelled by user')
      job.completedAt = new Date()
      return true
    }
    return false
  }
  
  // Очистить завершенные задачи
  static cleanupCompletedJobs() {
    const completed = Array.from(this.activeJobs.entries())
      .filter(([, job]) => ['completed', 'failed'].includes(job.status))
      .filter(([, job]) => {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 часа
        return job.completedAt && job.completedAt < cutoff
      })
    
    completed.forEach(([jobId]) => {
      this.activeJobs.delete(jobId)
    })
    
    console.log(`🧹 Cleaned up ${completed.length} completed jobs`)
  }
}

// Автоматическая очистка завершенных задач каждый час
setInterval(() => {
  ReviewCollectionManager.cleanupCompletedJobs()
}, 60 * 60 * 1000)

export { ReviewCollectionManager }
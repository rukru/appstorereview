import axios from 'axios'
import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { Review, ParsedReviews } from '@/types'

// Расширенная конфигурация для избежания блокировки
const RATE_LIMITING_CONFIG = {
  // Динамические задержки
  MIN_DELAY: 1000,      // 1-3 секунды между запросами  
  MAX_DELAY: 3000,
  BATCH_DELAY: 5000,    // 5 секунд между батчами
  ERROR_BACKOFF: 10000, // 10 секунд при ошибке
  
  // Размеры батчей
  COUNTRIES_BATCH_SIZE: 2,  // Обрабатываем по 2 страны одновременно
  MAX_PAGES_PER_COUNTRY: 20, // Увеличиваем лимит страниц
  
  // Retry логика
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
}

// Ротация User-Agent'ов для имитации разных браузеров
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36'
]

// Основные географические регионы
const MAJOR_COUNTRIES = [
  'us', 'gb', 'de', 'fr', 'jp', 'au', 'ca', 'ru', 
  'br', 'in', 'kr', 'it', 'es', 'mx', 'cn'
] as const

type CountryCode = typeof MAJOR_COUNTRIES[number]

// Интеллектуальная задержка с рандомизацией
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Получение случайного User-Agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// Функция нормализации контента для дедупликации
function normalizeReviewContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)
}

// Прогрессивный сбор отзывов с умной остановкой
async function fetchReviewsFromCountryProgressive(
  appId: string,
  country: CountryCode,
  maxPages = RATE_LIMITING_CONFIG.MAX_PAGES_PER_COUNTRY
): Promise<{ reviews: Review[], errors: string[], pagesProcessed: number }> {
  const reviews: Review[] = []
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenContentHashes = new Set<string>()
  
  let consecutiveEmptyPages = 0
  let pagesProcessed = 0
  
  console.log(`🌍 Starting progressive collection from ${country.toUpperCase()}...`)
  
  for (let page = 1; page <= maxPages; page++) {
    pagesProcessed = page
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/xml`
    
    let retryCount = 0
    let success = false
    
    while (retryCount < RATE_LIMITING_CONFIG.MAX_RETRIES && !success) {
      try {
        // Рандомная задержка перед запросом
        const delay = getRandomDelay(
          RATE_LIMITING_CONFIG.MIN_DELAY, 
          RATE_LIMITING_CONFIG.MAX_DELAY
        )
        await new Promise(resolve => setTimeout(resolve, delay))
        
        console.log(`📄 Fetching ${country.toUpperCase()} page ${page}/${maxPages} (attempt ${retryCount + 1})`)
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/rss+xml, application/xml, text/xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 15000, // Увеличенный таймаут
        })

        const $ = cheerio.load(response.data, { xmlMode: true })
        const pageReviews: Review[] = []

        $('entry').each((index, element) => {
          if (index === 0) return // Skip first entry (app info)

          const $entry = $(element)
          const id = $entry.find('id').text()
          const title = $entry.find('title').text()
          const rawContent = $entry.find('content').text()
          
          let content = rawContent
          if (content.includes('<table')) {
            content = content.substring(0, content.indexOf('<table')).trim()
          } else {
            content = cheerio.load(rawContent).text().trim()
          }
          
          const author = $entry.find('author name').text()
          const date = $entry.find('updated').text()
          const ratingText = $entry.find('im\\:rating').text() || '0'
          const rating = parseInt(ratingText, 10) || 0
          const version = $entry.find('im\\:version').text()

          if (title && content && rating > 0) {
            const finalId = id || createHash('md5')
              .update(`${appId}_${content}_${author}_${date}_${rating}_${country}`)
              .digest('hex')
              .substring(0, 16)
            
            const normalizedContent = normalizeReviewContent(content)
            const contentHash = createHash('md5')
              .update(`${normalizedContent}_${author}_${rating}`)
              .digest('hex')
            
            if (!seenIds.has(finalId) && !seenContentHashes.has(contentHash)) {
              seenIds.add(finalId)
              seenContentHashes.add(contentHash)
              
              pageReviews.push({
                id: finalId,
                title: title.trim(),
                content: content.trim(),
                rating,
                author: author || 'Anonymous',
                date: date || new Date().toISOString(),
                platform: 'appstore',
                appId,
                version: version || undefined,
              })
            }
          }
        })

        reviews.push(...pageReviews)
        success = true
        
        console.log(`✅ ${country.toUpperCase()} page ${page}: ${pageReviews.length} reviews`)
        
        // Умная остановка: если несколько страниц подряд пустые
        if (pageReviews.length === 0) {
          consecutiveEmptyPages++
          if (consecutiveEmptyPages >= 3) {
            console.log(`🛑 Stopping ${country.toUpperCase()} collection: ${consecutiveEmptyPages} consecutive empty pages`)
            break
          }
        } else {
          consecutiveEmptyPages = 0
        }
        
      } catch (error) {
        retryCount++
        const errorMsg = `❌ Error fetching ${country.toUpperCase()} page ${page} (attempt ${retryCount}): ${error instanceof Error ? error.message : 'Unknown error'}`
        console.warn(errorMsg)
        
        if (retryCount < RATE_LIMITING_CONFIG.MAX_RETRIES) {
          // Экспоненциальный backoff
          const backoffDelay = RATE_LIMITING_CONFIG.ERROR_BACKOFF * Math.pow(2, retryCount - 1)
          console.log(`⏳ Waiting ${backoffDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
        } else {
          errors.push(errorMsg)
          break // Переходим к следующей странице
        }
      }
    }
    
    if (!success) {
      console.error(`💥 Failed to fetch ${country.toUpperCase()} page ${page} after ${RATE_LIMITING_CONFIG.MAX_RETRIES} attempts`)
    }
  }
  
  console.log(`🏁 Completed ${country.toUpperCase()}: ${reviews.length} reviews from ${pagesProcessed} pages`)
  return { reviews, errors, pagesProcessed }
}

// Полный сбор отзывов со всех регионов с улучшенной защитой
export async function parseAppStoreReviewsComplete(
  appId: string,
  countries: CountryCode[] = [...MAJOR_COUNTRIES],
  progressCallback?: (progress: { country: string, reviewsCount: number, totalProgress: number }) => void
): Promise<ParsedReviews & { collectionStats: any }> {
  console.log(`🚀 Starting COMPLETE App Store review collection`)
  console.log(`📍 Target countries (${countries.length}): ${countries.join(', ').toUpperCase()}`)
  console.log(`⚙️  Rate limiting: ${RATE_LIMITING_CONFIG.MIN_DELAY}-${RATE_LIMITING_CONFIG.MAX_DELAY}ms delays, ${RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE} countries per batch`)
  
  const allReviews: Review[] = []
  const allErrors: string[] = []
  const countryStats: Record<string, { reviews: number, pages: number, errors: number }> = {}
  
  let totalProgress = 0
  
  // Обрабатываем страны батчами
  for (let i = 0; i < countries.length; i += RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE) {
    const batch = countries.slice(i, i + RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE)
    
    console.log(`\n🔄 Processing batch ${Math.floor(i / RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE) + 1}/${Math.ceil(countries.length / RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE)}: ${batch.join(', ').toUpperCase()}`)
    
    // Параллельная обработка стран в батче
    const batchPromises = batch.map(country => 
      fetchReviewsFromCountryProgressive(appId, country)
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result, index) => {
      const country = batch[index]
      totalProgress++
      
      if (result.status === 'fulfilled') {
        const { reviews, errors, pagesProcessed } = result.value
        allReviews.push(...reviews)
        allErrors.push(...errors)
        
        countryStats[country] = {
          reviews: reviews.length,
          pages: pagesProcessed,
          errors: errors.length
        }
        
        // Вызываем callback для отслеживания прогресса
        if (progressCallback) {
          progressCallback({
            country: country.toUpperCase(),
            reviewsCount: reviews.length,
            totalProgress: Math.round((totalProgress / countries.length) * 100)
          })
        }
        
      } else {
        const errorMsg = `Failed to process ${country}: ${result.reason?.message}`
        allErrors.push(errorMsg)
        console.error(errorMsg)
        
        countryStats[country] = { reviews: 0, pages: 0, errors: 1 }
      }
    })
    
    // Задержка между батчами (кроме последнего)
    if (i + RATE_LIMITING_CONFIG.COUNTRIES_BATCH_SIZE < countries.length) {
      console.log(`⏳ Waiting ${RATE_LIMITING_CONFIG.BATCH_DELAY}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, RATE_LIMITING_CONFIG.BATCH_DELAY))
    }
  }
  
  // Глобальная дедупликация
  const globalSeenContentHashes = new Set<string>()
  const uniqueReviews: Review[] = []
  
  for (const review of allReviews) {
    const normalizedContent = normalizeReviewContent(review.content)
    const contentHash = createHash('md5')
      .update(`${normalizedContent}_${review.author}_${review.rating}`)
      .digest('hex')
    
    if (!globalSeenContentHashes.has(contentHash)) {
      globalSeenContentHashes.add(contentHash)
      uniqueReviews.push(review)
    }
  }
  
  // Вычисляем статистику
  const totalRating = uniqueReviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = uniqueReviews.length > 0 ? totalRating / uniqueReviews.length : 0
  
  const collectionStats = {
    totalCountries: countries.length,
    successfulCountries: Object.keys(countryStats).length,
    totalReviewsCollected: allReviews.length,
    uniqueReviewsAfterDeduplication: uniqueReviews.length,
    deduplicationRate: Math.round(((allReviews.length - uniqueReviews.length) / allReviews.length) * 100),
    totalErrors: allErrors.length,
    countryBreakdown: countryStats,
    collectionDuration: 'N/A' // Можно добавить замер времени
  }
  
  // Логируем подробную статистику
  console.log('\n📊 COLLECTION COMPLETED - Detailed Statistics:')
  console.log(`Total unique reviews: ${uniqueReviews.length}`)
  console.log(`Average rating: ${Math.round(averageRating * 10) / 10}/5`)
  console.log(`Deduplication: ${allReviews.length} → ${uniqueReviews.length} (${collectionStats.deduplicationRate}% duplicates removed)`)
  console.log(`Errors: ${allErrors.length}`)
  
  console.log('\n🌍 Reviews by country:')
  Object.entries(countryStats)
    .sort(([,a], [,b]) => b.reviews - a.reviews)
    .forEach(([country, stats]) => {
      console.log(`  ${country.toUpperCase()}: ${stats.reviews} reviews (${stats.pages} pages, ${stats.errors} errors)`)
    })
  
  if (allErrors.length > 0) {
    console.log(`\n⚠️  ${allErrors.length} errors occurred during collection`)
  }

  return {
    reviews: uniqueReviews,
    totalCount: uniqueReviews.length,
    averageRating: Math.round(averageRating * 10) / 10,
    collectionStats
  }
}

// Инкрементальный сбор (добавление к существующим отзывам)
export async function parseAppStoreReviewsIncremental(
  appId: string,
  countries: CountryCode[] = ['us', 'gb', 'de', 'fr'], // Начинаем с основных регионов
  maxPagesPerCountry = 5 // Ограничиваем для инкрементального сбора
): Promise<ParsedReviews> {
  console.log(`🔄 Starting INCREMENTAL App Store review collection`)
  return parseAppStoreReviewsComplete(appId, countries)
}
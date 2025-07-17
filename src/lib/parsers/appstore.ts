import axios from 'axios'
import * as cheerio from 'cheerio'
import { createHash } from 'crypto'
import { Review, ParsedReviews } from '@/types'

// Основные географические регионы для сбора отзывов
const MAJOR_COUNTRIES = [
  'us',  // США
  'gb',  // Великобритания
  'de',  // Германия
  'fr',  // Франция
  'jp',  // Япония
  'au',  // Австралия
  'ca',  // Канада
  'ru',  // Россия
  'br',  // Бразилия
  'in',  // Индия
  'kr',  // Южная Корея
  'it',  // Италия
  'es',  // Испания
  'mx',  // Мексика
  'cn',  // Китай
] as const

type CountryCode = typeof MAJOR_COUNTRIES[number]

// Функция для нормализации текста отзыва для сравнения
function normalizeReviewContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Удаляем знаки пунктуации
    .replace(/\s+/g, ' ') // Нормализуем пробелы
    .trim()
    .substring(0, 200) // Берем первые 200 символов для сравнения
}

// Функция для получения отзывов из одного региона
async function fetchReviewsFromCountry(
  appId: string,
  country: CountryCode,
  maxPages = 3
): Promise<{ reviews: Review[], errors: string[] }> {
  const reviews: Review[] = []
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenContentHashes = new Set<string>()
  
  console.log(`Fetching reviews from ${country.toUpperCase()}...`)
  
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/xml`
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 10000,
      })

      const $ = cheerio.load(response.data, { xmlMode: true })
      const pageReviews: Review[] = []

      $('entry').each((index, element) => {
        if (index === 0) return // Skip first entry (app info)

        const $entry = $(element)
        const id = $entry.find('id').text()
        const title = $entry.find('title').text()
        const rawContent = $entry.find('content').text()
        
        // Правильное извлечение содержимого из RSS
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
          
          if (seenIds.has(finalId) || seenContentHashes.has(contentHash)) {
            return
          }
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
      })

      reviews.push(...pageReviews)
      
      // If no reviews found on this page, stop fetching from this country
      if (pageReviews.length === 0) {
        break
      }
      
      // Add small delay between requests
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (pageError) {
      const errorMsg = `Failed to fetch page ${page} from ${country}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`
      errors.push(errorMsg)
      console.warn(errorMsg)
      continue
    }
  }
  
  console.log(`✅ Fetched ${reviews.length} reviews from ${country.toUpperCase()}`)
  return { reviews, errors }
}

export async function parseAppStoreReviews(
  appId: string,
  countries: CountryCode[] = ['ru', 'us', 'gb', 'de'] // По умолчанию основные регионы
): Promise<ParsedReviews> {
  try {
    console.log(`🌍 Fetching App Store reviews from ${countries.length} countries: ${countries.join(', ').toUpperCase()}`)
    
    const allReviews: Review[] = []
    let totalRating = 0
    const allErrors: string[] = []
    const countryStats: Record<string, number> = {}
    
    // Fetch reviews from each country in parallel (with some rate limiting)
    const batchSize = 3 // Process 3 countries at a time to avoid rate limits
    
    for (let i = 0; i < countries.length; i += batchSize) {
      const batch = countries.slice(i, i + batchSize)
      
      const batchPromises = batch.map(country => 
        fetchReviewsFromCountry(appId, country, 3) // 3 pages per country
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        const country = batch[index]
        if (result.status === 'fulfilled') {
          const { reviews, errors } = result.value
          allReviews.push(...reviews)
          allErrors.push(...errors)
          countryStats[country] = reviews.length
          
          reviews.forEach(review => {
            totalRating += review.rating
          })
        } else {
          const errorMsg = `Failed to fetch reviews from ${country}: ${result.reason.message}`
          allErrors.push(errorMsg)
          console.error(errorMsg)
          countryStats[country] = 0
        }
      })
      
      // Delay between batches
      if (i + batchSize < countries.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Remove duplicates globally (across all countries)
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
    
    const averageRating = uniqueReviews.length > 0 ? totalRating / allReviews.length : 0
    
    // Log statistics
    console.log('\n📊 Collection Statistics:')
    console.log(`Total unique reviews: ${uniqueReviews.length}`)
    console.log(`Average rating: ${Math.round(averageRating * 10) / 10}/5`)
    console.log('Reviews by country:')
    Object.entries(countryStats).forEach(([country, count]) => {
      console.log(`  ${country.toUpperCase()}: ${count} reviews`)
    })
    
    if (allErrors.length > 0) {
      console.log(`\n⚠️  ${allErrors.length} errors occurred during collection`)
    }

    return {
      reviews: uniqueReviews,
      totalCount: uniqueReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    }
  } catch (error) {
    console.error('Error parsing App Store reviews:', error)
    throw new Error('Failed to parse App Store reviews')
  }
}

// Новая функция для сбора отзывов со всех основных регионов
export async function parseAppStoreReviewsAllRegions(
  appId: string
): Promise<ParsedReviews> {
  return parseAppStoreReviews(appId, [...MAJOR_COUNTRIES])
}

// Функция для сбора отзывов только из определенных регионов
export async function parseAppStoreReviewsFromRegions(
  appId: string,
  regions: ('americas' | 'europe' | 'asia' | 'english')[]
): Promise<ParsedReviews> {
  const regionMapping = {
    americas: ['us', 'ca', 'br', 'mx'] as CountryCode[],
    europe: ['gb', 'de', 'fr', 'it', 'es', 'ru'] as CountryCode[],
    asia: ['jp', 'kr', 'in', 'cn'] as CountryCode[],
    english: ['us', 'gb', 'au', 'ca'] as CountryCode[]
  }
  
  const countries = regions.flatMap(region => regionMapping[region])
  const uniqueCountries = [...new Set(countries)] // Remove duplicates
  
  return parseAppStoreReviews(appId, uniqueCountries)
}

// Backward compatibility: старая функция теперь использует новую логику
export async function parseAppStoreReviewsSingleCountry(
  appId: string,
  country: CountryCode = 'ru'
): Promise<ParsedReviews> {
  return parseAppStoreReviews(appId, [country])
}

export async function searchAppStoreApp(
  searchTerm: string,
  country = 'ru'
): Promise<Array<{ id: string; name: string; bundleId: string }>> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&country=${country}&entity=software&limit=10`

    const response = await axios.get(url)

    return response.data.results.map((app: any) => ({
      id: app.trackId.toString(),
      name: app.trackName,
      bundleId: app.bundleId,
    }))
  } catch (error) {
    console.error('Error searching App Store:', error)
    throw new Error('Failed to search App Store')
  }
}

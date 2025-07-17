// Dynamic import for ES module compatibility
let gplay: any

async function getGplay() {
  if (!gplay) {
    gplay = await import('google-play-scraper')
    gplay = gplay.default || gplay
  }
  return gplay
}
import { createHash } from 'crypto'
import { Review, ParsedReviews } from '@/types'

// Функция для нормализации текста отзыва для сравнения
function normalizeReviewContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Удаляем знаки пунктуации
    .replace(/\s+/g, ' ') // Нормализуем пробелы
    .trim()
    .substring(0, 200) // Берем первые 200 символов для сравнения
}

export async function parseGooglePlayReviews(
  packageName: string,
  lang = 'ru',
  country = 'ru'
): Promise<ParsedReviews> {
  try {
    console.log(`Fetching Google Play reviews for ${packageName}...`)
    
    const gplayLib = await getGplay()
    const reviews: Review[] = []
    let totalRating = 0
    const seenContentHashes = new Set<string>() // Для предотвращения дубликатов по содержанию
    
    // Fetch multiple pages of reviews
    let allGoogleReviews: any[] = []
    
    try {
      // Fetch first batch of reviews
      const reviewOptions = {
        appId: packageName,
        lang: lang,
        country: country,
        sort: gplayLib.sort.NEWEST,
        num: 50, // Get 50 reviews at a time
      }
      
      console.log('Fetching reviews with options:', reviewOptions)
      const firstBatch = await gplayLib.reviews(reviewOptions)
      allGoogleReviews = firstBatch.data || []
      
      // Try to get more reviews if we have a next token
      if (firstBatch.nextPaginationToken && allGoogleReviews.length < 100) {
        try {
          const secondBatch = await gplayLib.reviews({
            ...reviewOptions,
            nextPaginationToken: firstBatch.nextPaginationToken,
            num: 50
          })
          allGoogleReviews = [...allGoogleReviews, ...(secondBatch.data || [])]
        } catch (secondError) {
          console.warn('Could not fetch second batch of reviews:', secondError instanceof Error ? secondError.message : 'Unknown error')
        }
      }
      
    } catch (gplayError) {
      console.error('Google Play scraper error:', gplayError)
      throw new Error(`Failed to fetch Google Play reviews: ${gplayError instanceof Error ? gplayError.message : 'Unknown error'}`)
    }
    
    console.log(`Fetched ${allGoogleReviews.length} reviews from Google Play`)
    
    // Process the reviews
    for (const gReview of allGoogleReviews) {
      try {
        const content = gReview.text || ''
        const title = gReview.title || content.substring(0, 50) + '...' || 'No Title'
        const rating = gReview.score || 0
        const author = gReview.userName || 'Anonymous'
        const date = gReview.date ? new Date(gReview.date).toISOString() : new Date().toISOString()
        
        if (content && rating > 0) {
          // Создаем хэш нормализованного содержания для проверки дубликатов
          const normalizedContent = normalizeReviewContent(content)
          const contentHash = createHash('md5')
            .update(`${normalizedContent}_${author}_${rating}`)
            .digest('hex')
          
          // Пропускаем дубликаты по содержанию
          if (seenContentHashes.has(contentHash)) {
            continue // Skip this review
          }
          seenContentHashes.add(contentHash)
          
          // Create stable ID
          const finalId = gReview.id || createHash('md5')
            .update(`${packageName}_${content}_${author}_${date}_${rating}`)
            .digest('hex')
            .substring(0, 16)
          
          reviews.push({
            id: finalId,
            title: title.trim(),
            content: content.trim(),
            rating,
            author: author || 'Anonymous',
            date,
            platform: 'googleplay',
            appId: packageName,
            version: gReview.version || undefined,
          })

          totalRating += rating
        }
      } catch (reviewError) {
        console.warn('Error processing individual review:', reviewError)
        continue
      }
    }

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    console.log(`Successfully processed ${reviews.length} Google Play reviews`)
    
    return {
      reviews,
      totalCount: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    }
  } catch (error) {
    console.error('Error parsing Google Play reviews:', error)
    throw new Error(`Failed to parse Google Play reviews: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function searchGooglePlayApp(
  searchTerm: string,
  country = 'ru'
): Promise<Array<{ id: string; name: string; bundleId: string }>> {
  try {
    console.log(`Searching Google Play for: ${searchTerm}`)
    
    const gplayLib = await getGplay()
    
    const searchResults = await gplayLib.search({
      term: searchTerm,
      num: 10,
      lang: 'ru',
      country: country,
    })
    
    console.log(`Found ${searchResults.length} apps on Google Play`)
    
    return searchResults.map((app: any) => ({
      id: app.appId,
      name: app.title,
      bundleId: app.appId,
    }))
  } catch (error) {
    console.error('Error searching Google Play:', error)
    throw new Error(`Failed to search Google Play: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

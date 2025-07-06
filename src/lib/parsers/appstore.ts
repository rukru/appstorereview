import axios from 'axios'
import * as cheerio from 'cheerio'
import { Review, ParsedReviews } from '@/types'

export async function parseAppStoreReviews(
  appId: string,
  country = 'ru'
): Promise<ParsedReviews> {
  try {
    let allReviews: Review[] = []
    let totalRating = 0
    
    // Fetch multiple pages to get more reviews
    for (let page = 1; page <= 10; page++) {
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
        const reviews: Review[] = []

        $('entry').each((index, element) => {
          if (index === 0) return // Skip first entry (app info)

          const $entry = $(element)
          const id = $entry.find('id').text()
          const title = $entry.find('title').text()
          const rawContent = $entry.find('content').text()
          // Strip HTML tags from content
          const content = cheerio.load(rawContent).text()
          const author = $entry.find('author name').text()
          const date = $entry.find('updated').text()

          // Extract rating from content or im:rating
          const ratingText = $entry.find('im\\:rating').text() || '0'
          const rating = parseInt(ratingText, 10) || 0

          // Extract version if available
          const version = $entry.find('im\\:version').text()

          if (title && content && rating > 0) {
            reviews.push({
              id: id || `appstore_${page}_${index}`,
              title: title.trim(),
              content: content.trim(),
              rating,
              author: author || 'Anonymous',
              date: date || new Date().toISOString(),
              platform: 'appstore',
              appId,
              version: version || undefined,
            })

            totalRating += rating
          }
        })

        allReviews = [...allReviews, ...reviews]
        
        // If no reviews found on this page, stop fetching
        if (reviews.length === 0) {
          break
        }
        
        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (pageError) {
        console.warn(`Failed to fetch page ${page}:`, pageError)
        // Continue with next page
        continue
      }
    }

    const averageRating = allReviews.length > 0 ? totalRating / allReviews.length : 0

    return {
      reviews: allReviews,
      totalCount: allReviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    }
  } catch (error) {
    console.error('Error parsing App Store reviews:', error)
    throw new Error('Failed to parse App Store reviews')
  }
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

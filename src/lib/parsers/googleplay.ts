import axios from 'axios'
import * as cheerio from 'cheerio'
import { Review, ParsedReviews } from '@/types'

export async function parseGooglePlayReviews(
  packageName: string,
  lang = 'en',
  country = 'us'
): Promise<ParsedReviews> {
  try {
    // Google Play Store app page
    const url = `https://play.google.com/store/apps/details?id=${packageName}&hl=${lang}&gl=${country}`

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    const $ = cheerio.load(response.data)
    const reviews: Review[] = []
    let totalRating = 0

    // Find review elements - Google Play uses dynamic content, so we'll look for common patterns
    $('[data-review-id]').each((index, element) => {
      const $review = $(element)

      // Extract review data
      const reviewId = $review.attr('data-review-id') || `googleplay_${index}`
      const title = $review
        .find('[class*="review"] h3, [class*="title"]')
        .first()
        .text()
        .trim()
      const content = $review
        .find('[class*="review-text"], [class*="content"]')
        .text()
        .trim()
      const author = $review
        .find('[class*="author"], [class*="name"]')
        .text()
        .trim()

      // Extract rating (looking for star ratings)
      const ratingElement = $review.find(
        '[role="img"][aria-label*="star"], [class*="rating"]'
      )
      let rating = 0

      if (ratingElement.length > 0) {
        const ariaLabel = ratingElement.attr('aria-label') || ''
        const ratingMatch = ariaLabel.match(/(\d+)\s*star/i)
        if (ratingMatch) {
          rating = parseInt(ratingMatch[1], 10)
        }
      }

      // Extract date
      const dateElement = $review.find('[class*="date"], time')
      const date =
        dateElement.attr('datetime') ||
        dateElement.text() ||
        new Date().toISOString()

      if (content && rating > 0) {
        reviews.push({
          id: reviewId,
          title: title || 'No Title',
          content: content,
          rating,
          author: author || 'Anonymous',
          date,
          platform: 'googleplay',
          appId: packageName,
        })

        totalRating += rating
      }
    })

    // If no reviews found with the above method, try alternative selectors
    if (reviews.length === 0) {
      // Try to find reviews in script tags (Google often embeds data in JSON)
      const scripts = $('script').toArray()

      for (const script of scripts) {
        const scriptContent = $(script).html() || ''

        // Look for review data patterns in JavaScript
        const reviewMatches = scriptContent.match(
          /\["[^"]*",\s*"[^"]*",\s*\d+,/g
        )

        if (reviewMatches) {
          reviewMatches.slice(0, 20).forEach((match, index) => {
            try {
              const parts = match.replace(/[\[\]]/g, '').split(',')
              if (parts.length >= 3) {
                const title = parts[0]?.replace(/"/g, '') || 'No Title'
                const content = parts[1]?.replace(/"/g, '') || ''
                const rating = parseInt(parts[2]?.trim() || '0', 10)

                if (content && rating > 0) {
                  reviews.push({
                    id: `googleplay_${index}`,
                    title,
                    content,
                    rating,
                    author: 'Anonymous',
                    date: new Date().toISOString(),
                    platform: 'googleplay',
                    appId: packageName,
                  })

                  totalRating += rating
                }
              }
            } catch (e) {
              // Skip malformed entries
            }
          })

          break
        }
      }
    }

    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    return {
      reviews,
      totalCount: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
    }
  } catch (error) {
    console.error('Error parsing Google Play reviews:', error)
    throw new Error('Failed to parse Google Play reviews')
  }
}

export async function searchGooglePlayApp(
  searchTerm: string
): Promise<Array<{ id: string; name: string }>> {
  try {
    // This is a simplified search - in production, you might want to use the Google Play API
    const url = `https://play.google.com/store/search?q=${encodeURIComponent(searchTerm)}&c=apps`

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    const $ = cheerio.load(response.data)
    const apps: Array<{ id: string; name: string }> = []

    // Find app links in search results
    $('a[href*="/store/apps/details?id="]').each((index, element) => {
      if (index >= 10) return false // Limit to 10 results

      const href = $(element).attr('href') || ''
      const packageMatch = href.match(/id=([^&]+)/)
      const name = $(element).find('[class*="title"], h3, h4').text().trim()

      if (packageMatch && name) {
        apps.push({
          id: packageMatch[1],
          name: name,
        })
      }
    })

    return apps
  } catch (error) {
    console.error('Error searching Google Play:', error)
    throw new Error('Failed to search Google Play')
  }
}

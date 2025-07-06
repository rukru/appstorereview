import OpenAI from 'openai'
import { AnalysisResult, Review } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeReviews(
  reviews: Review[]
): Promise<AnalysisResult> {
  try {
    const reviewsText = reviews
      .map(
        review =>
          `Rating: ${review.rating}/5\nTitle: ${review.title}\nContent: ${review.content}\n---`
      )
      .join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert app review analyzer. Analyze the provided app reviews and return ONLY a valid JSON response (no markdown, no code blocks) with the following structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "themes": ["theme1", "theme2", ...],
  "summary": "Brief summary of overall review sentiment and key points",
  "recommendations": ["recommendation1", "recommendation2", ...],
  "score": 0-100,
  "problems": [
    {
      "title": "Problem title",
      "description": "Detailed description of the issue",
      "severity": "high" | "medium" | "low",
      "affectedReviews": number_of_reviews_mentioning_this_issue,
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}

Focus on:
- Overall sentiment analysis
- Common themes and issues mentioned
- Actionable recommendations for developers
- A numerical score representing overall user satisfaction
- Identify specific problems with keywords that can be used to filter reviews
- Keywords should be in the same language as the reviews (Russian for Russian reviews)

For problems, include relevant keywords that users mention when describing each issue. These keywords will be used to filter and show related reviews.

IMPORTANT: Return only the JSON object, no additional text or formatting.`,
        },
        {
          role: 'user',
          content: `Analyze these app reviews:\n\n${reviewsText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    // Clean the response - remove markdown code blocks if present
    let cleanedResult = result.trim()
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    try {
      return JSON.parse(cleanedResult) as AnalysisResult
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw OpenAI response:', result)
      console.error('Cleaned response:', cleanedResult)
      
      // Fallback: try to extract JSON from the response manually
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as AnalysisResult
        } catch (fallbackError) {
          console.error('Fallback parse error:', fallbackError)
        }
      }
      
      throw new Error('Failed to parse OpenAI response as JSON')
    }
  } catch (error) {
    console.error('Error analyzing reviews:', error)
    throw new Error('Failed to analyze reviews')
  }
}

export async function generateInsights(reviews: Review[]): Promise<string> {
  try {
    const reviewsText = reviews
      .slice(0, 20)
      .map(review => `${review.rating}★ - ${review.title}: ${review.content}`)
      .join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert product manager analyzing app reviews. Provide actionable insights and recommendations based on user feedback.',
        },
        {
          role: 'user',
          content: `Based on these app reviews, provide key insights and recommendations for the development team:\n\n${reviewsText}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    })

    return completion.choices[0]?.message?.content || 'No insights generated'
  } catch (error) {
    console.error('Error generating insights:', error)
    throw new Error('Failed to generate insights')
  }
}

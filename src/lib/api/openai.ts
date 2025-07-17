import OpenAI from 'openai'
import { AnalysisResult, Review } from '@/types'

// Enhanced analysis schema for structured output
const enhancedAnalysisSchema = {
  type: "object",
  properties: {
    sentiment: {
      type: "string",
      enum: ["positive", "negative", "neutral", "mixed"],
      description: "Overall sentiment of the reviews"
    },
    score: {
      type: "number",
      minimum: 1,
      maximum: 10,
      description: "Overall satisfaction score from 1 to 10"
    },
    summary: {
      type: "string",
      description: "Brief summary of the analysis in Russian"
    },
    themes: {
      type: "array",
      items: { type: "string" },
      description: "Main themes and topics mentioned in reviews"
    },
    recommendations: {
      type: "array",
      items: { type: "string" },
      description: "Actionable recommendations for developers"
    },
    appreciatedFeatures: {
      type: "array",
      description: "Features that users appreciate and thank for",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Name of the appreciated feature"
          },
          description: {
            type: "string",
            description: "Why users appreciate this feature"
          },
          mentionCount: {
            type: "number",
            description: "How many times this feature was mentioned positively"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords associated with this feature"
          },
          averageRating: {
            type: "number",
            minimum: 1,
            maximum: 5,
            description: "Average rating from reviews mentioning this feature"
          }
        },
        required: ["title", "description", "mentionCount", "keywords", "averageRating"],
        additionalProperties: false
      }
    },
    featureRequests: {
      type: "array",
      description: "New features that users are requesting",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Name of the requested feature"
          },
          description: {
            type: "string",
            description: "Description of what users want"
          },
          urgency: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "How urgently users need this feature"
          },
          mentionCount: {
            type: "number",
            description: "How many times this feature was requested"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords associated with this request"
          }
        },
        required: ["title", "description", "urgency", "mentionCount", "keywords"],
        additionalProperties: false
      }
    },
    problems: {
      type: "array",
      description: "Issues and problems reported by users",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Name of the problem"
          },
          description: {
            type: "string",
            description: "Description of the problem"
          },
          severity: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Severity level of the problem"
          },
          affectedReviews: {
            type: "number",
            description: "Number of reviews mentioning this problem"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords associated with this problem"
          }
        },
        required: ["title", "description", "severity", "affectedReviews", "keywords"],
        additionalProperties: false
      }
    },
    reviewsAnalyzed: {
      type: "number",
      description: "Total number of reviews analyzed"
    }
  },
  required: ["sentiment", "score", "summary", "themes", "recommendations", "appreciatedFeatures", "featureRequests", "problems", "reviewsAnalyzed"],
  additionalProperties: false
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({
    apiKey,
  });
}

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

    const systemPrompt = `Ты эксперт по анализу отзывов пользователей. Анализируй отзывы и выделяй:
1. Функции за которые пользователи благодарят (appreciatedFeatures)
2. Запросы на новые функции (featureRequests) 
3. Проблемы (problems)
4. Общий sentiment и оценку
5. Краткое резюме

Важные правила:
- Ищи конкретные благодарности: "спасибо за", "нравится", "отличный"
- Определяй запросы: "хотелось бы", "добавьте", "нужна функция"
- Выделяй проблемы: "не работает", "вылетает", "ошибка"
- Используй русские ключевые слова
- Указывай realistic mentionCount на основе фактических упоминаний

Отвечай строго в JSON формате согласно схеме.`

    const userPrompt = `Проанализируй следующие отзывы пользователей о приложении:\n\n${reviewsText}\n\nТвоя задача:\n1. Определи общий sentiment и оценку\n2. Выдели функции за которые пользователи благодарят (appreciatedFeatures)\n3. Найди запросы на новые функции (featureRequests)\n4. Определи проблемы (problems)\n5. Напиши краткое резюме\n6. Определи основные темы и рекомендации\n\nОтвечай строго в JSON формате согласно схеме.`

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "enhanced_analysis_result",
          schema: enhancedAnalysisSchema,
          strict: true
        }
      },
      temperature: 0.3,
    })

    const result = completion.choices[0]?.message?.content
    if (!result) {
      throw new Error('No response from OpenAI')
    }

    // With structured output, we can directly parse the JSON
    try {
      return JSON.parse(result) as AnalysisResult
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw OpenAI response:', result)
      throw new Error('Failed to parse OpenAI structured response as JSON')
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

    const openai = getOpenAIClient();
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

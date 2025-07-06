export interface Review {
  id: string
  title: string
  content: string
  rating: number
  author: string
  date: string
  platform: 'appstore' | 'googleplay'
  appId: string
  version?: string
  helpful?: number
}

export interface ParsedReviews {
  reviews: Review[]
  totalCount: number
  averageRating: number
}

export interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  themes: string[]
  summary: string
  recommendations: string[]
  score: number
  problems: Problem[]
}

export interface Problem {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  affectedReviews: number
  keywords: string[]
}

export type DateFilter = 'all' | '7days' | '30days' | '90days'

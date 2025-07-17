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
  appName?: string
}

export interface AnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  themes: string[]
  summary: string
  recommendations: string[]
  score: number
  problems: Problem[]
  appreciatedFeatures: AppreciatedFeature[]
  featureRequests: FeatureRequest[]
  reviewsAnalyzed: number
  shareId?: string
  isPublic?: boolean
}

export interface Problem {
  title: string
  description: string
  severity: 'high' | 'medium' | 'low'
  affectedReviews: number
  keywords: string[]
}

export interface AppreciatedFeature {
  title: string
  description: string
  mentionCount: number
  keywords: string[]
  averageRating: number
}

export interface FeatureRequest {
  title: string
  description: string
  urgency: 'high' | 'medium' | 'low'
  mentionCount: number
  keywords: string[]
}

export type DateFilter = 'all' | '7days' | '30days' | '90days'

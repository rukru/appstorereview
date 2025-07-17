'use client'

import { useState, useEffect } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { ReviewsList } from '@/components/ReviewsList'
import { AnalysisPanel } from '@/components/AnalysisPanel'
import { SavedAnalyses } from '@/components/SavedAnalyses'
import { Review, ParsedReviews, AnalysisResult, DateFilter } from '@/types'

export default function Home() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsData, setReviewsData] = useState<ParsedReviews | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null)
  const [currentAppId, setCurrentAppId] = useState<string | null>(null)
  const [currentPlatform, setCurrentPlatform] = useState<'appstore' | 'googleplay' | null>(null)
  const [fromCache, setFromCache] = useState<boolean>(false)

  const handleSearch = async (
    appId: string,
    platform: 'appstore' | 'googleplay',
    forceRefresh = false,
    geoScope = 'major'
  ) => {
    setIsLoadingReviews(true)
    setReviews([])
    setReviewsData(null)
    setAnalysis(null)
    setCurrentAppId(appId)
    setCurrentPlatform(platform)

    try {
      const params = new URLSearchParams({
        appId,
        platform,
        ...(forceRefresh && { forceRefresh: 'true' }),
        ...(platform === 'appstore' && { geoScope })
      })
      const url = `/api/reviews?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data: ParsedReviews & { fromCache?: boolean } = await response.json()
      
      setReviews(data.reviews || [])
      setReviewsData(data)
      setFilteredReviews(data.reviews || [])
      setFromCache(data.fromCache || false)
      setAnalysis(null)
      setSelectedProblem(null)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      alert('Failed to fetch reviews. Please check the app ID and try again.')
    } finally {
      setIsLoadingReviews(false)
    }
  }

  const filterReviewsByDate = (reviewsToFilter: Review[], filter: DateFilter): Review[] => {
    if (filter === 'all') return reviewsToFilter

    const now = new Date()
    const days = filter === '7days' ? 7 : filter === '30days' ? 30 : 90
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    return reviewsToFilter.filter(review => {
      const reviewDate = new Date(review.date)
      return reviewDate >= cutoffDate
    })
  }

  const filterReviewsByProblem = (reviewsToFilter: Review[], problemKeywords: string[]): Review[] => {
    if (problemKeywords.length === 0) return reviewsToFilter

    return reviewsToFilter.filter(review => {
      const content = `${review.title} ${review.content}`.toLowerCase()
      return problemKeywords.some(keyword => content.includes(keyword.toLowerCase()))
    })
  }

  const applyFilters = () => {
    let filtered = filterReviewsByDate(reviews, dateFilter)
    
    if (selectedProblem && analysis) {
      const problem = analysis.problems.find(p => p.title === selectedProblem)
      if (problem) {
        filtered = filterReviewsByProblem(filtered, problem.keywords)
      }
    }
    
    setFilteredReviews(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [reviews, dateFilter, selectedProblem, analysis]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAnalyze = async () => {
    if (filteredReviews.length === 0) return

    setIsLoadingAnalysis(true)

    try {
      const requestBody: any = { 
        reviews: filteredReviews,
        dateFilter: dateFilter
      }
      
      // Если есть appId и platform, передаем их для сохранения в БД
      if (currentAppId && currentPlatform) {
        requestBody.appId = currentAppId
        requestBody.platform = currentPlatform
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze reviews')
      }

      const analysisResult: AnalysisResult = await response.json()
      setAnalysis(analysisResult)
    } catch (error) {
      console.error('Error analyzing reviews:', error)
      alert(
        'Failed to analyze reviews. Please make sure you have set up your OpenAI API key.'
      )
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  const handleProblemClick = (problemTitle: string) => {
    if (selectedProblem === problemTitle) {
      setSelectedProblem(null)
    } else {
      setSelectedProblem(problemTitle)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            App Store Review Analyzer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Analyze app reviews from App Store and Google Play with AI-powered
            insights
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Form and Saved Analyses */}
          <div className="lg:col-span-1 space-y-6">
            <SearchForm 
              onSearch={handleSearch} 
              onAnalyze={handleAnalyze}
              isLoading={isLoadingReviews}
              isAnalyzing={isLoadingAnalysis}
              hasReviews={reviews.length > 0}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              currentAppId={currentAppId || undefined}
              fromCache={fromCache}
            />
            
            {/* Saved Analyses Panel */}
            <SavedAnalyses />
          </div>

          {/* Analysis and Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analysis Results - Now at the top */}
            {analysis && (
              <AnalysisPanel
                analysis={analysis}
                isLoading={isLoadingAnalysis}
                onAnalyze={handleAnalyze}
                onProblemClick={handleProblemClick}
                selectedProblem={selectedProblem}
                platform={currentPlatform || undefined}
                appName={currentAppId || undefined}
              />
            )}

            {/* Reviews List - Now below analysis */}
            {reviewsData && (
              <ReviewsList
                reviews={filteredReviews}
                totalCount={filteredReviews.length}
                averageRating={reviewsData.averageRating}
                isLoading={isLoadingReviews}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

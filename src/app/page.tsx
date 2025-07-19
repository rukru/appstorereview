'use client'

import { useState, useEffect } from 'react'
import { SidebarPanel } from '@/components/SidebarPanel'
import { ReviewsList } from '@/components/ReviewsList'
import { AnalysisPanel } from '@/components/AnalysisPanel'
import { Review, ParsedReviews, AnalysisResult, DateFilter } from '@/types'
import { MessageCircle, Star, TrendingUp, Target, Brain } from 'lucide-react'

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
    forceRefresh = false
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
        ...(forceRefresh && { forceRefresh: 'true' })
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl gradient-bg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Review Analyzer
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform app reviews into actionable insights with AI-powered analysis. 
            Discover what users love, need, and struggle with.
          </p>
        </div>

        {/* Dashboard Header with Quick Stats */}
        {reviewsData && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl card-hover">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{filteredReviews.length}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reviews</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl card-hover">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                    <Star className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{reviewsData.averageRating.toFixed(1)}</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
                  </div>
                </div>
              </div>

              {analysis && (
                <>
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl card-hover">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-lg ${
                        analysis.sentiment === 'positive' ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
                        analysis.sentiment === 'negative' ? 'bg-gradient-to-br from-red-500 to-rose-500' :
                        'bg-gradient-to-br from-orange-500 to-amber-500'
                      }`}>
                        <TrendingUp className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{analysis.sentiment}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sentiment</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl card-hover">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                        <Target className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{analysis.score}/10</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Satisfaction</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col xl:grid xl:grid-cols-4 gap-8">
          {/* Sidebar Panel - Mobile: Full width, Desktop: 1 column */}
          <div className="xl:col-span-1 order-1 xl:order-1">
            <div className="xl:sticky xl:top-4">
              <SidebarPanel 
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
            </div>
          </div>

          {/* Main Content Area - Mobile: Full width below sidebar, Desktop: 3 columns */}
          <div className="xl:col-span-3 order-2 xl:order-2 space-y-6 xl:space-y-8">
            {/* Analysis Results */}
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

            {/* Reviews List */}
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

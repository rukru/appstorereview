'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { SearchHeader } from '@/components/SearchHeader'
import { SavedAnalysesContent } from '@/components/SavedAnalysesContent'
import { SavedApps } from '@/components/SavedApps'
import { ReviewsList } from '@/components/ReviewsList'
import { AnalysisPanel } from '@/components/AnalysisPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Review, ParsedReviews, AnalysisResult, DateFilter } from '@/types'
import { MessageCircle, Star, TrendingUp, Target, Brain, Bookmark, History, Search } from 'lucide-react'

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

  const handleAppSelect = (selectedAppId: string, selectedPlatform: 'appstore' | 'googleplay') => {
    handleSearch(selectedAppId, selectedPlatform, false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      {/* Header */}
      <Header />
      
      {/* Search Section */}
      <SearchHeader 
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

      <main className="container mx-auto px-4 py-6">

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-9 space-y-6">
            {/* Empty State */}
            {!reviewsData && !isLoadingReviews && (
              <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <Brain className="w-12 h-12 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Ready to Analyze Reviews
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    Enter an app ID and platform to start collecting and analyzing reviews with AI-powered insights.
                  </p>
                </div>
              </div>
            )}

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

          {/* Sidebar for Saved Data - Only on large screens */}
          <div className="xl:col-span-3 hidden xl:block">
            <div className="sticky top-32">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Saved Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="analyses" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="analyses" className="flex items-center gap-1 text-xs">
                        <History className="h-3 w-3" />
                        Analyses
                      </TabsTrigger>
                      <TabsTrigger value="apps" className="flex items-center gap-1 text-xs">
                        <Search className="h-3 w-3" />
                        Apps
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="analyses" className="mt-3">
                      <div className="max-h-80 overflow-y-auto">
                        <SavedAnalysesContent />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="apps" className="mt-3">
                      <div className="max-h-80 overflow-y-auto">
                        <SavedApps 
                          onAppSelect={handleAppSelect}
                          selectedAppId={currentAppId || undefined}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

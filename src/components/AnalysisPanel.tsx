'use client'

import { useState } from 'react'
import { AnalysisResult, Problem, AppreciatedFeature, FeatureRequest } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Target,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Heart,
  Star,
  Plus,
  Zap,
  Share2,
  Copy,
  Check,
} from 'lucide-react'

interface AnalysisPanelProps {
  analysis: AnalysisResult | null
  isLoading?: boolean
  onAnalyze?: () => void
  onProblemClick?: (problemTitle: string) => void
  selectedProblem?: string | null
  isPublicView?: boolean
  platform?: 'appstore' | 'googleplay'
  appName?: string
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'negative':
      return <TrendingDown className="h-4 w-4 text-red-500" />
    case 'mixed':
      return <Minus className="h-4 w-4 text-orange-500" />
    default:
      return <Minus className="h-4 w-4 text-yellow-500" />
  }
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return 'border-green-200 bg-green-50 text-green-800'
    case 'negative':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'mixed':
      return 'border-orange-200 bg-orange-50 text-orange-800'
    default:
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'medium':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Info className="h-4 w-4 text-blue-500" />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800'
  }
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high':
      return 'border-red-200 bg-red-50 text-red-800'
    case 'medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800'
    default:
      return 'border-green-200 bg-green-50 text-green-800'
  }
}

const getUrgencyIcon = (urgency: string) => {
  switch (urgency) {
    case 'high':
      return <Zap className="h-4 w-4 text-red-500" />
    case 'medium':
      return <Plus className="h-4 w-4 text-yellow-500" />
    default:
      return <Info className="h-4 w-4 text-green-500" />
  }
}

export function AnalysisPanel({
  analysis,
  isLoading,
  onAnalyze,
  onProblemClick,
  selectedProblem,
  isPublicView = false,
  platform,
  appName,
}: AnalysisPanelProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle')

  const handleCopyLink = async () => {
    if (!analysis?.shareId) return
    
    setCopyStatus('copying')
    
    try {
      // Сначала сделать анализ публичным
      const makePublicResponse = await fetch(`/api/analysis/${analysis.shareId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: true
        })
      })
      
      if (!makePublicResponse.ok) {
        console.error('Failed to make analysis public')
        // Продолжаем даже если не удалось сделать публичным
      }
      
      // Создать ссылку
      const shareUrl = `${window.location.origin}/analysis/${analysis.shareId}`
      
      // Попробовать копировать через clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl)
          setCopyStatus('copied')
        } catch (clipboardErr) {
          console.log('Clipboard API failed, using fallback')
          // Fallback для старых браузеров
          fallbackCopyToClipboard(shareUrl)
        }
      } else {
        // Fallback для старых браузеров
        fallbackCopyToClipboard(shareUrl)
      }
      
      // Обновить состояние анализа
      if (analysis) {
        analysis.isPublic = true
      }
      
      // Сохранить в localStorage для панели
      saveSharedLink(shareUrl, analysis)
      
      setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
      
    } catch (err) {
      console.error('Failed to copy:', err)
      setCopyStatus('idle')
    }
  }
  
  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      document.execCommand('copy')
      setCopyStatus('copied')
    } catch (err) {
      console.error('Fallback copy failed:', err)
      setCopyStatus('idle')
    }
    
    document.body.removeChild(textArea)
  }
  
  const saveSharedLink = (url: string, analysis: any) => {
    try {
      const savedLinks = JSON.parse(localStorage.getItem('sharedAnalyses') || '[]')
      const newLink = {
        shareId: analysis.shareId,
        url: url,
        appName: appName || analysis.appName || analysis.appId || 'Unknown App',
        platform: platform || analysis.platform || 'unknown',
        createdAt: new Date().toISOString(),
        sentiment: analysis.sentiment,
        score: analysis.score
      }
      
      console.log('Saving shared link:', newLink) // Debug
      
      // Добавить новую ссылку в начало массива
      const updatedLinks = [newLink, ...savedLinks.filter((link: any) => link.shareId !== analysis.shareId)]
      
      // Оставить только последние 10 ссылок
      const limitedLinks = updatedLinks.slice(0, 10)
      
      localStorage.setItem('sharedAnalyses', JSON.stringify(limitedLinks))
    } catch (err) {
      console.error('Failed to save shared link:', err)
    }
  }
  if (!analysis && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
          <p className="text-muted-foreground mb-6">
            Fetch some reviews first, then analyze them with AI to get insights.
          </p>
          {onAnalyze && (
            <Button onClick={onAnalyze} disabled={!onAnalyze}>
              <Brain className="h-4 w-4 mr-2" />
              Analyze Reviews
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Analyzing Reviews...</h3>
          <p className="text-muted-foreground">
            AI is processing the reviews to generate insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
            {!isPublicView && analysis.shareId && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  disabled={copyStatus === 'copying'}
                  className="flex items-center gap-2"
                >
                  {copyStatus === 'copied' ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Скопировано!
                    </>
                  ) : copyStatus === 'copying' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Копирование...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Поделиться
                    </>
                  )}
                </Button>
                {analysis.isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    <Share2 className="h-3 w-3 mr-1" />
                    Публичный
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Sentiment & Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Overall Sentiment</h4>
              <div className="flex items-center gap-2">
                {getSentimentIcon(analysis.sentiment)}
                <Badge
                  variant="outline"
                  className={getSentimentColor(analysis.sentiment)}
                >
                  {analysis.sentiment.charAt(0).toUpperCase() +
                    analysis.sentiment.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Satisfaction Score</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.score >= 7
                        ? 'bg-green-500'
                        : analysis.score >= 4
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${(analysis.score / 10) * 100}%` }}
                  />
                </div>
                <span className="font-bold text-lg">{analysis.score}/10</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Summary
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appreciated Features */}
      {analysis.appreciatedFeatures && analysis.appreciatedFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Appreciated Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.appreciatedFeatures.map((feature, index) => (
                <div key={index} className="p-3 rounded-lg border border-pink-200 bg-pink-50">
                  <div className="flex items-start gap-3">
                    <Star className="h-4 w-4 text-pink-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm">{feature.title}</h5>
                        <Badge variant="outline" className="border-pink-200 bg-pink-100 text-pink-800">
                          {feature.averageRating}★
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {feature.mentionCount} mentions
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {feature.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {feature.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-pink-200">
                            {keyword}
                          </Badge>
                        ))}
                        {feature.keywords.length > 5 && (
                          <Badge variant="outline" className="text-xs border-pink-200">
                            +{feature.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Requests */}
      {analysis.featureRequests && analysis.featureRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Feature Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.featureRequests.map((request, index) => (
                <div key={index} className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-3">
                    {getUrgencyIcon(request.urgency)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm">{request.title}</h5>
                        <Badge
                          variant="outline"
                          className={getUrgencyColor(request.urgency)}
                        >
                          {request.urgency} priority
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {request.mentionCount} requests
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {request.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-blue-200">
                            {keyword}
                          </Badge>
                        ))}
                        {request.keywords.length > 5 && (
                          <Badge variant="outline" className="text-xs border-blue-200">
                            +{request.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.themes.map((theme, index) => (
              <Badge key={index} variant="secondary">
                {theme}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Problems */}
      {analysis.problems && analysis.problems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Identified Problems
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.problems.map((problem, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-colors ${
                    !isPublicView && selectedProblem === problem.title
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200'
                  } ${!isPublicView ? 'cursor-pointer hover:border-gray-300' : ''}`}
                  onClick={!isPublicView ? () => onProblemClick?.(problem.title) : undefined}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(problem.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm">{problem.title}</h5>
                        <Badge
                          variant="outline"
                          className={getSeverityColor(problem.severity)}
                        >
                          {problem.severity}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {problem.affectedReviews} reviews
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {problem.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {problem.keywords.slice(0, 5).map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {problem.keywords.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{problem.keywords.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedProblem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-1" />
                  Click on a problem to filter reviews and see related feedback. Click again to clear the filter.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{recommendation}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

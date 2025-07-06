'use client'

import { AnalysisResult, Problem } from '@/types'
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
} from 'lucide-react'

interface AnalysisPanelProps {
  analysis: AnalysisResult | null
  isLoading?: boolean
  onAnalyze?: () => void
  onProblemClick?: (problemTitle: string) => void
  selectedProblem?: string | null
}

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'negative':
      return <TrendingDown className="h-4 w-4 text-red-500" />
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

export function AnalysisPanel({
  analysis,
  isLoading,
  onAnalyze,
  onProblemClick,
  selectedProblem,
}: AnalysisPanelProps) {
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
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis Results
          </CardTitle>
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
                      analysis.score >= 70
                        ? 'bg-green-500'
                        : analysis.score >= 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
                <span className="font-bold text-lg">{analysis.score}/100</span>
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
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProblem === problem.title
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onProblemClick?.(problem.title)}
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

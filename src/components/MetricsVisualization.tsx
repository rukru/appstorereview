'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AnalysisResult } from '@/types'
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Plus, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'

interface MetricsVisualizationProps {
  analysis: AnalysisResult
}

export function MetricsVisualization({ analysis }: MetricsVisualizationProps) {
  const totalFeatures = analysis.appreciatedFeatures?.length || 0
  const totalRequests = analysis.featureRequests?.length || 0
  const totalProblems = analysis.problems?.length || 0

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-500 to-green-500'
    if (score >= 6) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  const getSentimentData = () => {
    const colors = {
      positive: { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', value: 0 },
      negative: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', value: 0 },
      mixed: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-300', value: 0 },
      neutral: { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-700 dark:text-gray-300', value: 0 }
    }

    if (analysis.sentiment === 'positive') colors.positive.value = 100
    else if (analysis.sentiment === 'negative') colors.negative.value = 100
    else if (analysis.sentiment === 'mixed') colors.mixed.value = 100
    else colors.neutral.value = 100

    return colors
  }

  const sentimentData = getSentimentData()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Satisfaction Score Visualization */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Satisfaction Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-lg font-bold">{analysis.score}/10</span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${getScoreColor(analysis.score)} transition-all duration-1000 ease-out`}
                style={{ width: `${(analysis.score / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Heart className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-emerald-600">{totalFeatures}</p>
              <p className="text-xs text-emerald-600">Loved Features</p>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Plus className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-600">{totalRequests}</p>
              <p className="text-xs text-blue-600">Requests</p>
            </div>
            
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{totalProblems}</p>
              <p className="text-xs text-red-600">Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Sentiment Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${sentimentData[analysis.sentiment as keyof typeof sentimentData].bg}`}>
              {analysis.sentiment === 'positive' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              <span className={`font-semibold capitalize ${sentimentData[analysis.sentiment as keyof typeof sentimentData].text}`}>
                {analysis.sentiment}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(sentimentData).map(([sentiment, data]) => (
              <div key={sentiment} className="flex items-center gap-3">
                <span className="text-sm font-medium capitalize w-16">{sentiment}</span>
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${data.bg.includes('emerald') ? 'bg-emerald-500' : 
                      data.bg.includes('red') ? 'bg-red-500' : 
                      data.bg.includes('orange') ? 'bg-orange-500' : 'bg-gray-500'} transition-all duration-500`}
                    style={{ width: `${data.value}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">{data.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Problem Severity Distribution */}
      {analysis.problems && analysis.problems.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Problem Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['high', 'medium', 'low'].map(severity => {
                const count = analysis.problems?.filter(p => p.severity === severity).length || 0
                const percentage = totalProblems > 0 ? (count / totalProblems) * 100 : 0
                const color = severity === 'high' ? 'red' : severity === 'medium' ? 'yellow' : 'blue'
                
                return (
                  <div key={severity} className={`p-4 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 border border-${color}-200 dark:border-${color}-800`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium text-${color}-700 dark:text-${color}-300 capitalize`}>
                        {severity} Severity
                      </span>
                      <Badge variant="outline" className={`text-${color}-700 dark:text-${color}-300 border-${color}-300`}>
                        {count}
                      </Badge>
                    </div>
                    <div className={`h-2 bg-${color}-100 dark:bg-${color}-900 rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full bg-${color}-500 transition-all duration-700`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className={`text-xs text-${color}-600 dark:text-${color}-400 mt-1`}>
                      {percentage.toFixed(1)}% of issues
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
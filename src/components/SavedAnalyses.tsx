'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface SavedAnalysis {
  shareId: string
  url: string
  appName: string
  platform: string
  createdAt: string
  sentiment: string
  score: number
}

export function SavedAnalyses() {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([])
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadSavedAnalyses()
  }, [])

  const loadSavedAnalyses = () => {
    try {
      const saved = localStorage.getItem('sharedAnalyses')
      if (saved) {
        setSavedAnalyses(JSON.parse(saved))
      }
    } catch (err) {
      console.error('Failed to load saved analyses:', err)
    }
  }

  const copyLink = async (analysis: SavedAnalysis) => {
    try {
      await navigator.clipboard.writeText(analysis.url)
      setCopyStatus(prev => ({ ...prev, [analysis.shareId]: true }))
      
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [analysis.shareId]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const deleteAnalysis = (shareId: string) => {
    try {
      const updatedAnalyses = savedAnalyses.filter(analysis => analysis.shareId !== shareId)
      setSavedAnalyses(updatedAnalyses)
      localStorage.setItem('sharedAnalyses', JSON.stringify(updatedAnalyses))
    } catch (err) {
      console.error('Failed to delete analysis:', err)
    }
  }

  const clearAll = () => {
    setSavedAnalyses([])
    localStorage.removeItem('sharedAnalyses')
  }

  const refreshAnalyses = () => {
    loadSavedAnalyses()
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getPlatformLabel = (platform: string) => {
    return platform === 'appstore' ? 'App Store' : 'Google Play'
  }

  if (savedAnalyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Сохраненные анализы</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Пока нет сохраненных анализов.<br />
            Поделитесь анализом, чтобы он появился здесь.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Сохраненные анализы</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Очистить все
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedAnalyses.map((analysis) => (
            <div key={analysis.shareId} className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{analysis.appName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getPlatformLabel(analysis.platform)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSentimentColor(analysis.sentiment)}`}
                    >
                      {getSentimentIcon(analysis.sentiment)}
                      <span className="ml-1 capitalize">{analysis.sentiment}</span>
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3" />
                      {analysis.score}/10
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAnalysis(analysis.shareId)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Calendar className="h-3 w-3" />
                {formatDate(analysis.createdAt)}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(analysis)}
                  className="flex-1"
                >
                  {copyStatus[analysis.shareId] ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Копировать
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(analysis.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
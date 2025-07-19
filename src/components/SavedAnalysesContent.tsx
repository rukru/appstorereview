'use client'

import { useState, useEffect } from 'react'
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
  Minus,
  Smartphone,
  Globe
} from 'lucide-react'
import { useAppInfo } from '@/hooks/useAppInfo'

interface SavedAnalysis {
  shareId: string
  url: string
  appName: string
  appId: string
  platform: string
  createdAt: string
  sentiment: string
  score: number
}

interface AppInfoDisplayProps {
  appId: string
  platform: string
  fallbackName: string
}

function AppInfoDisplay({ appId, platform, fallbackName }: AppInfoDisplayProps) {
  const { appInfo, loading } = useAppInfo(appId, platform)
  
  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-gray-200 rounded-lg animate-pulse"></div>
        <div>
          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {appInfo?.icon ? (
        <img 
          src={appInfo.icon} 
          alt={appInfo.name}
          className="w-6 h-6 rounded-lg"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
          {platform === 'appstore' ? (
            <Smartphone className="w-3 h-3 text-gray-500" />
          ) : (
            <Globe className="w-3 h-3 text-gray-500" />
          )}
        </div>
      )}
      <div>
        <h4 className="font-medium text-sm truncate max-w-32">{appInfo?.name || fallbackName}</h4>
      </div>
    </div>
  )
}

export function SavedAnalysesContent() {
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-500" />
      case 'mixed':
        return <Minus className="h-3 w-3 text-orange-500" />
      default:
        return <Minus className="h-3 w-3 text-yellow-500" />
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
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Пока нет сохраненных анализов.<br />
          Поделитесь анализом, чтобы он появился здесь.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearAll}
          className="text-red-600 hover:text-red-700 text-xs"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Очистить все
        </Button>
      </div>
      
      <div className="space-y-3">
        {savedAnalyses.map((analysis) => (
          <div key={analysis.shareId} className="p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <AppInfoDisplay 
                  appId={analysis.appId || analysis.appName}
                  platform={analysis.platform}
                  fallbackName={analysis.appName}
                />
                <div className="flex items-center gap-1 mt-2 flex-wrap">
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
              >
                <Trash2 className="h-3 w-3" />
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
                className="flex-1 text-xs"
              >
                {copyStatus[analysis.shareId] ? (
                  <>
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Копировать
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(analysis.url, '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
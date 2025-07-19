'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Smartphone, 
  Globe, 
  Brain, 
  Calendar,
  RotateCcw,
  Settings
} from 'lucide-react'
import { DateFilter } from '@/types'

interface SearchHeaderProps {
  onSearch: (appId: string, platform: 'appstore' | 'googleplay', forceRefresh?: boolean) => void
  onAnalyze?: () => void
  isLoading?: boolean
  isAnalyzing?: boolean
  hasReviews?: boolean
  dateFilter?: DateFilter
  onDateFilterChange?: (filter: DateFilter) => void
  currentAppId?: string
  fromCache?: boolean
}

export function SearchHeader({
  onSearch,
  onAnalyze,
  isLoading,
  isAnalyzing,
  hasReviews,
  dateFilter,
  onDateFilterChange,
  currentAppId,
  fromCache
}: SearchHeaderProps) {
  const [appId, setAppId] = useState('')
  const [platform, setPlatform] = useState<'appstore' | 'googleplay'>('appstore')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const savedAppId = localStorage.getItem('lastAppId')
    const savedPlatform = localStorage.getItem('lastPlatform') as 'appstore' | 'googleplay'
    
    if (savedAppId) setAppId(savedAppId)
    if (savedPlatform) setPlatform(savedPlatform)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (appId.trim()) {
      localStorage.setItem('lastAppId', appId.trim())
      localStorage.setItem('lastPlatform', platform)
      onSearch(appId.trim(), platform, false)
    }
  }

  const handlePlatformChange = (newPlatform: 'appstore' | 'googleplay') => {
    setPlatform(newPlatform)
    localStorage.setItem('lastPlatform', newPlatform)
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-b sticky top-16 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80">
      <div className="container mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 flex-wrap">
          {/* Platform Selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              type="button"
              variant={platform === 'appstore' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePlatformChange('appstore')}
              className="h-8 px-3 text-xs"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              App Store
            </Button>
            <Button
              type="button"
              variant={platform === 'googleplay' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePlatformChange('googleplay')}
              className="h-8 px-3 text-xs"
            >
              <Globe className="h-3 w-3 mr-1" />
              Google Play
            </Button>
          </div>

          {/* App ID Input */}
          <div className="flex-1 min-w-64">
            <Input
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder={platform === 'appstore' ? 'App Store ID (e.g. 1624701477)' : 'Package name (e.g. com.example.app)'}
              className="h-8 text-sm"
              required
            />
          </div>

          {/* Search Button */}
          <Button 
            type="submit" 
            disabled={isLoading}
            size="sm"
            className="h-8 px-4"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
            ) : (
              <Search className="h-3 w-3 mr-2" />
            )}
            {isLoading ? 'Loading...' : 'Get Reviews'}
          </Button>

          {/* Additional Controls */}
          {hasReviews && (
            <>
              {/* Force Refresh */}
              {currentAppId && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => onSearch(currentAppId, platform, true)}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
              )}

              {/* Settings Toggle */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="h-8 px-3"
              >
                <Settings className="h-3 w-3 mr-1" />
                {showSettings ? 'Hide' : 'Options'}
              </Button>

              {/* Analyze Button */}
              {onAnalyze && (
                <Button 
                  type="button"
                  onClick={onAnalyze} 
                  disabled={isAnalyzing}
                  size="sm"
                  className="h-8 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Brain className="h-3 w-3 mr-2" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
              )}
            </>
          )}
        </form>

        {/* Expandable Settings */}
        {showSettings && hasReviews && onDateFilterChange && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
              </div>
              
              <div className="flex items-center gap-1">
                {(['all', '7days', '30days', '90days'] as DateFilter[]).map((filter) => (
                  <Button
                    key={filter}
                    type="button"
                    variant={dateFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onDateFilterChange(filter)}
                    className="h-7 px-3 text-xs"
                  >
                    {filter === 'all' ? 'All Time' : 
                     filter === '7days' ? '7 Days' :
                     filter === '30days' ? '30 Days' : '90 Days'}
                  </Button>
                ))}
              </div>

              {fromCache && (
                <Badge variant="secondary" className="text-xs">
                  📋 From cache
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
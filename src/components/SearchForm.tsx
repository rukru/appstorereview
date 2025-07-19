'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Smartphone, Globe, Brain, Calendar } from 'lucide-react'
import { DateFilter } from '@/types'
import { SavedApps } from './SavedApps'

interface SearchFormProps {
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

export function SearchForm({ onSearch, onAnalyze, isLoading, isAnalyzing, hasReviews, dateFilter, onDateFilterChange, currentAppId, fromCache }: SearchFormProps) {
  const [appId, setAppId] = useState('')
  const [platform, setPlatform] = useState<'appstore' | 'googleplay'>(
    'appstore'
  )

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedAppId = localStorage.getItem('lastAppId')
    const savedPlatform = localStorage.getItem('lastPlatform') as 'appstore' | 'googleplay'
    
    if (savedAppId) {
      setAppId(savedAppId)
    }
    if (savedPlatform) {
      setPlatform(savedPlatform)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (appId.trim()) {
      // Save to localStorage before submitting
      localStorage.setItem('lastAppId', appId.trim())
      localStorage.setItem('lastPlatform', platform)
      
      onSearch(appId.trim(), platform, false)
    }
  }

  const handlePlatformChange = (newPlatform: 'appstore' | 'googleplay') => {
    setPlatform(newPlatform)
    // Save platform change immediately
    localStorage.setItem('lastPlatform', newPlatform)
  }

  const handleAppSelect = (selectedAppId: string, selectedPlatform: 'appstore' | 'googleplay') => {
    setAppId(selectedAppId)
    setPlatform(selectedPlatform)
    
    // Save to localStorage
    localStorage.setItem('lastAppId', selectedAppId)
    localStorage.setItem('lastPlatform', selectedPlatform)
    
    // Trigger search
    onSearch(selectedAppId, selectedPlatform, false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search App Reviews
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={platform === 'appstore' ? 'default' : 'outline'}
                onClick={() => handlePlatformChange('appstore')}
                className="flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                App Store
              </Button>
              <Button
                type="button"
                variant={platform === 'googleplay' ? 'default' : 'outline'}
                onClick={() => handlePlatformChange('googleplay')}
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Google Play
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="appId" className="text-sm font-medium">
              {platform === 'appstore' ? 'App Store ID' : 'Package Name'}
            </label>
            <Input
              id="appId"
              value={appId}
              onChange={e => setAppId(e.target.value)}
              placeholder={
                platform === 'appstore'
                  ? 'Enter App Store ID'
                  : 'Enter package name'
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              {platform === 'appstore'
                ? 'Find the App Store ID in the app URL: https://apps.apple.com/app/id[APP_ID]'
                : 'Find the package name in the Play Store URL: https://play.google.com/store/apps/details?id=[PACKAGE_NAME]'}
            </p>
          </div>

          <div className="space-y-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Fetching Reviews...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Get Reviews
                </>
              )}
            </Button>
            
            {hasReviews && currentAppId && (
              <Button 
                type="button" 
                variant="outline" 
                disabled={isLoading} 
                className="w-full"
                onClick={() => onSearch(currentAppId, platform, true)}
              >
                Force Refresh
              </Button>
            )}
            
            {hasReviews && fromCache && (
              <div className="text-xs text-muted-foreground text-center bg-blue-50 p-2 rounded">
                📋 Data loaded from cache
              </div>
            )}
          </div>
          
        </form>

        {/* Date Filter */}
        {hasReviews && onDateFilterChange && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Analysis Period
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                type="button"
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                onClick={() => onDateFilterChange('all')}
                size="sm"
              >
                All Time
              </Button>
              <Button
                type="button"
                variant={dateFilter === '7days' ? 'default' : 'outline'}
                onClick={() => onDateFilterChange('7days')}
                size="sm"
              >
                7 Days
              </Button>
              <Button
                type="button"
                variant={dateFilter === '30days' ? 'default' : 'outline'}
                onClick={() => onDateFilterChange('30days')}
                size="sm"
              >
                30 Days
              </Button>
              <Button
                type="button"
                variant={dateFilter === '90days' ? 'default' : 'outline'}
                onClick={() => onDateFilterChange('90days')}
                size="sm"
              >
                90 Days
              </Button>
            </div>
          </div>
        )}

        {/* AI Analysis Button */}
        {hasReviews && onAnalyze && (
          <div className="mt-4">
            <Button 
              onClick={onAnalyze} 
              disabled={isAnalyzing} 
              className="w-full"
              variant="secondary"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Analyzing Reviews...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          </div>
        )}


      </CardContent>
    </Card>
  )
}

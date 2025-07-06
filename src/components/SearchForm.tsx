'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Smartphone, Globe, Brain, Calendar } from 'lucide-react'
import { DateFilter } from '@/types'

interface SearchFormProps {
  onSearch: (appId: string, platform: 'appstore' | 'googleplay') => void
  onAnalyze?: () => void
  isLoading?: boolean
  isAnalyzing?: boolean
  hasReviews?: boolean
  dateFilter?: DateFilter
  onDateFilterChange?: (filter: DateFilter) => void
}

export function SearchForm({ onSearch, onAnalyze, isLoading, isAnalyzing, hasReviews, dateFilter, onDateFilterChange }: SearchFormProps) {
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
      
      onSearch(appId.trim(), platform)
    }
  }

  const handlePlatformChange = (newPlatform: 'appstore' | 'googleplay') => {
    setPlatform(newPlatform)
    // Save platform change immediately
    localStorage.setItem('lastPlatform', newPlatform)
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
                  ? 'e.g., 284882215 (for Facebook)'
                  : 'e.g., com.facebook.katana'
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              {platform === 'appstore'
                ? 'Find the App Store ID in the app URL: https://apps.apple.com/app/id[APP_ID]'
                : 'Find the package name in the Play Store URL: https://play.google.com/store/apps/details?id=[PACKAGE_NAME]'}
            </p>
          </div>

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
        </form>

        {/* Date Filter */}
        {hasReviews && onDateFilterChange && (
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Analysis Period
            </label>
            <div className="grid grid-cols-2 gap-2">
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

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium">Popular Apps for Testing:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">App Store RU</Badge>
              <span className="text-sm">Telegram: 686449807</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">App Store RU</Badge>
              <span className="text-sm">VK: 564177498</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">App Store RU</Badge>
              <span className="text-sm">Яндекс.Карты: 313877526</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Google Play</Badge>
              <span className="text-sm">WhatsApp: com.whatsapp</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Google Play</Badge>
              <span className="text-sm">
                YouTube: com.google.android.youtube
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

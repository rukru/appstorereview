'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Smartphone, Globe, Calendar, BarChart3, Trash2 } from 'lucide-react'
import { useAppInfo } from '@/hooks/useAppInfo'

interface App {
  id: string
  appId: string
  platform: 'APPSTORE' | 'GOOGLEPLAY'
  name: string | null
  updatedAt: string
  _count: {
    reviews: number
    analyses: number
  }
}

interface SavedAppsProps {
  onAppSelect: (appId: string, platform: 'appstore' | 'googleplay') => void
  selectedAppId?: string
}

// Utility functions
function getPlatformKey(platform: string): 'appstore' | 'googleplay' {
  return platform === 'APPSTORE' ? 'appstore' : 'googleplay'
}

function getPlatformIcon(platform: string) {
  return platform === 'APPSTORE' ? (
    <Smartphone className="h-4 w-4" />
  ) : (
    <Globe className="h-4 w-4" />
  )
}

function getPlatformName(platform: string) {
  return platform === 'APPSTORE' ? 'App Store' : 'Google Play'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface AppDisplayProps {
  app: App
  isSelected: boolean
  onSelect: () => void
}

function AppDisplay({ app, isSelected, onSelect }: AppDisplayProps) {
  const { appInfo, loading } = useAppInfo(app.appId, getPlatformKey(app.platform))
  
  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="flex-shrink-0">
          {loading ? (
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          ) : appInfo?.icon ? (
            <img 
              src={appInfo.icon} 
              alt={appInfo.name || app.name || app.appId}
              className="w-10 h-10 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex')
              }}
            />
          ) : null}
          
          {/* Fallback Icon */}
          <div 
            className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center"
            style={{ display: appInfo?.icon ? 'none' : 'flex' }}
          >
            {getPlatformIcon(app.platform)}
          </div>
        </div>
        
        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {getPlatformName(app.platform)}
            </span>
          </div>
          
          <div className="font-semibold text-sm truncate mb-1">
            {appInfo?.name || app.name || `App ID: ${app.appId}`}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(app.updatedAt)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {app._count.reviews} reviews
            </Badge>
            <Badge variant="outline" className="text-xs">
              {app._count.analyses} analyses
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SavedApps({ onAppSelect, selectedAppId }: SavedAppsProps) {
  const [apps, setApps] = useState<App[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/apps')
      if (response.ok) {
        const data = await response.json()
        setApps(data)
      }
    } catch (error) {
      console.error('Error fetching apps:', error)
    } finally {
      setIsLoading(false)
    }
  }



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Saved Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (apps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Saved Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved apps yet. Analyze some apps to see them here!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Saved Apps ({apps.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {apps.map((app) => (
          <AppDisplay
            key={app.id}
            app={app}
            isSelected={selectedAppId === app.appId}
            onSelect={() => onAppSelect(app.appId, getPlatformKey(app.platform))}
          />
        ))}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={fetchApps}
        >
          Refresh List
        </Button>
      </CardContent>
    </Card>
  )
}
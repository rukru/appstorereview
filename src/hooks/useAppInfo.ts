import { useState, useEffect } from 'react'

export interface AppInfo {
  name: string
  icon: string | null
  bundleId: string
  description: string | null
  averageRating: number | null
  ratingCount: number | null
}

export function useAppInfo(appId: string | null, platform: string | null) {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!appId || !platform) {
      setAppInfo(null)
      return
    }

    // Проверяем кэш
    const cacheKey = `app-info-${platform}-${appId}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      try {
        const cachedData = JSON.parse(cached)
        const isExpired = Date.now() - cachedData.timestamp > 24 * 60 * 60 * 1000 // 24 hours
        
        if (!isExpired) {
          setAppInfo(cachedData.data)
          return
        }
      } catch (err) {
        console.error('Error parsing cached app info:', err)
      }
    }

    const fetchAppInfo = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/app-info?appId=${appId}&platform=${platform}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch app info')
        }

        const data = await response.json()
        
        // Кэшируем результат
        localStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
        
        setAppInfo(data)
      } catch (err) {
        console.error('Error fetching app info:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        
        // Fallback к базовой информации
        setAppInfo({
          name: appId,
          icon: null,
          bundleId: appId,
          description: null,
          averageRating: null,
          ratingCount: null
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppInfo()
  }, [appId, platform])

  return { appInfo, loading, error }
}
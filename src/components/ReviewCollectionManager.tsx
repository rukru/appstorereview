'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { 
  Download, 
  Pause, 
  Play, 
  Square, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Globe,
  Settings
} from 'lucide-react'

interface CollectionJob {
  id: string
  appId: string
  platform: 'appstore' | 'googleplay'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  totalCountries: number
  completedCountries: number
  reviewsCollected: number
  errors: string[]
  startedAt?: string
  completedAt?: string
}

interface CollectionManagerProps {
  appId?: string
  platform?: 'appstore' | 'googleplay'
  onCollectionComplete?: (reviewsCount: number) => void
}

export function ReviewCollectionManager({ 
  appId, 
  platform,
  onCollectionComplete 
}: CollectionManagerProps) {
  const [activeJobs, setActiveJobs] = useState<CollectionJob[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<'complete' | 'incremental'>('complete')
  const [isStarting, setIsStarting] = useState(false)
  
  // Polling для обновления статуса задач
  useEffect(() => {
    const pollJobs = async () => {
      try {
        const response = await fetch('/api/reviews/collect')
        if (response.ok) {
          const data = await response.json()
          setActiveJobs(data.activeJobs)
          
          // Проверяем завершенные задачи
          data.activeJobs.forEach((job: CollectionJob) => {
            if (job.status === 'completed' && onCollectionComplete) {
              onCollectionComplete(job.reviewsCollected)
            }
          })
        }
      } catch (error) {
        console.error('Error polling jobs:', error)
      }
    }

    // Сразу загружаем данные
    pollJobs()
    
    // Затем polling каждые 2 секунды
    const interval = setInterval(pollJobs, 2000)
    return () => clearInterval(interval)
  }, [onCollectionComplete])

  const startCollection = async () => {
    if (!appId || !platform) return

    setIsStarting(true)
    try {
      const response = await fetch('/api/reviews/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          platform,
          strategy: {
            type: selectedStrategy,
            respectRateLimit: true,
            pauseOnErrors: false
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Collection started:', data.jobId)
      } else {
        const error = await response.json()
        console.error('Failed to start collection:', error)
      }
    } catch (error) {
      console.error('Error starting collection:', error)
    } finally {
      setIsStarting(false)
    }
  }

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/reviews/collect?jobId=${jobId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('Job cancelled:', jobId)
      }
    } catch (error) {
      console.error('Error cancelling job:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return 'N/A'
    
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}s`
    if (duration < 3600) return `${Math.round(duration / 60)}m`
    return `${Math.round(duration / 3600)}h`
  }

  // Фильтруем задачи для текущего приложения
  const currentAppJobs = activeJobs.filter(job => 
    !appId || job.appId === appId
  )

  const isCollecting = currentAppJobs.some(job => 
    job.status === 'running' || job.status === 'pending'
  )

  return (
    <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5" />
          Complete Review Collection
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Запуск новой коллекции */}
        {appId && platform && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Collection Strategy:</span>
            </div>
            
            <Tabs value={selectedStrategy} onValueChange={(v: any) => setSelectedStrategy(v)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="complete">Complete Collection</TabsTrigger>
                <TabsTrigger value="incremental">Incremental</TabsTrigger>
              </TabsList>
              
              <TabsContent value="complete" className="mt-2">
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Collects from all 15 major regions</p>
                  <p>• Up to 20 pages per country (~300 reviews each)</p>
                  <p>• Estimated time: 5-15 minutes</p>
                  <p>• Smart rate limiting to avoid blocks</p>
                </div>
              </TabsContent>
              
              <TabsContent value="incremental" className="mt-2">
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Collects from 4 major regions (US, GB, DE, FR)</p>
                  <p>• Up to 5 pages per country</p>
                  <p>• Estimated time: 2-5 minutes</p>
                  <p>• Good for regular updates</p>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button
              onClick={startCollection}
              disabled={isCollecting || isStarting}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Collection...
                </>
              ) : isCollecting ? (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Collection in Progress
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start {selectedStrategy === 'complete' ? 'Complete' : 'Incremental'} Collection
                </>
              )}
            </Button>
          </div>
        )}

        {/* Активные задачи */}
        {currentAppJobs.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Collection Status</span>
            </div>
            
            {currentAppJobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getStatusIcon(job.status)}
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-600 truncate">
                      {job.platform === 'appstore' ? 'App Store' : 'Google Play'}
                    </span>
                  </div>
                  
                  {(job.status === 'running' || job.status === 'paused') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelJob(job.id)}
                      className="flex-shrink-0"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
                
                {job.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="truncate">Progress: {job.completedCountries}/{job.totalCountries} countries</span>
                      <span className="flex-shrink-0">{job.progress}%</span>
                    </div>
                    <Progress value={job.progress} className="h-2" />
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="text-gray-500 text-xs">Reviews:</span>
                    <div className="font-medium truncate">{job.reviewsCollected.toLocaleString()}</div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 text-xs">Duration:</span>
                    <div className="font-medium truncate">{formatDuration(job.startedAt, job.completedAt)}</div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 text-xs">Errors:</span>
                    <div className="font-medium text-red-600 truncate">{job.errors.length}</div>
                  </div>
                </div>
                
                {job.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      View Errors ({job.errors.length})
                    </summary>
                    <div className="mt-2 p-2 bg-red-50 rounded border max-h-32 overflow-y-auto">
                      {job.errors.map((error, index) => (
                        <div key={index} className="text-red-700">{error}</div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Информация */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          <p className="font-medium mb-1">ℹ️ About Complete Collection:</p>
          <p>This feature collects reviews from multiple regions with smart rate limiting to avoid API blocks. The process respects Apple&apos;s servers and includes automatic retry logic for failed requests.</p>
        </div>
      </CardContent>
    </Card>
  )
}
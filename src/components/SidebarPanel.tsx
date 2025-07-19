'use client'

import { SearchForm } from './SearchForm'
import { SavedAnalyses } from './SavedAnalyses'
import { SavedApps } from './SavedApps'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Search, Bookmark, History } from 'lucide-react'
import { DateFilter } from '@/types'

interface SidebarPanelProps {
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

export function SidebarPanel(props: SidebarPanelProps) {
  const handleAppSelect = (selectedAppId: string, selectedPlatform: 'appstore' | 'googleplay') => {
    props.onSearch(selectedAppId, selectedPlatform, false)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm {...props} />
      
      {/* Saved Data with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Saved Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="analyses" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analyses" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Analyses
              </TabsTrigger>
              <TabsTrigger value="apps" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Apps
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyses" className="mt-4">
              <div className="h-64 xl:h-96 overflow-y-auto">
                <SavedAnalyses />
              </div>
            </TabsContent>
            
            <TabsContent value="apps" className="mt-4">
              <div className="h-64 xl:h-96 overflow-y-auto">
                <SavedApps 
                  onAppSelect={handleAppSelect}
                  selectedAppId={props.currentAppId}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
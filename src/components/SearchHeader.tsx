'use client'

import { SearchForm } from './SearchForm'
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

export function SearchHeader(props: SearchHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <SearchForm {...props} />
        </div>
      </div>
    </div>
  )
}
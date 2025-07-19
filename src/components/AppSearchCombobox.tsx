'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Star, Smartphone, Globe, Loader2 } from 'lucide-react'
import { SearchableApp, AppSearchResult } from '@/types'

interface AppSearchComboboxProps {
  platform: 'appstore' | 'googleplay'
  onAppSelect: (app: SearchableApp) => void
  placeholder?: string
  className?: string
}

export function AppSearchCombobox({ 
  platform, 
  onAppSelect, 
  placeholder,
  className 
}: AppSearchComboboxProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchableApp[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const searchApps = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/search-apps?q=${encodeURIComponent(searchQuery)}&platform=${platform}&limit=8`
      )
      
      if (response.ok) {
        const data: AppSearchResult = await response.json()
        setResults(data.results)
        setShowResults(true)
        setSelectedIndex(-1)
      } else {
        setResults([])
        setShowResults(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchApps(value)
    }, 300)
  }

  const handleAppSelect = (app: SearchableApp) => {
    setQuery(app.name)
    setShowResults(false)
    setSelectedIndex(-1)
    onAppSelect(app)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleAppSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      if (!resultsRef.current?.contains(document.activeElement)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }, 200)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          placeholder={placeholder || `Search ${platform === 'appstore' ? 'App Store' : 'Google Play'}...`}
          className="h-8 text-sm pr-8"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto shadow-lg border"
        >
          <div className="p-1">
            {results.map((app, index) => (
              <button
                key={app.id}
                onClick={() => handleAppSelect(app)}
                className={`w-full p-3 text-left rounded-md transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  index === selectedIndex ? 'bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Image 
                    src={app.icon} 
                    alt={app.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{app.name}</h4>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        {platform === 'appstore' ? (
                          <Smartphone className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        {platform === 'appstore' ? 'iOS' : 'Android'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{app.developer}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {app.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {app.rating.toFixed(1)}
                        </div>
                      )}
                      {app.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {formatNumber(app.reviewCount)} reviews
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{app.category}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* No Results */}
      {showResults && !isSearching && query.length >= 2 && results.length === 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg border">
          <div className="p-4 text-center text-sm text-gray-500">
            No apps found for &quot;{query}&quot;
          </div>
        </Card>
      )}
    </div>
  )
}
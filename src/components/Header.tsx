'use client'

import { Brain } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-bg">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Review Analyzer
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI-powered insights
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AnalysisPanel } from '@/components/AnalysisPanel'
import { AnalysisResult } from '@/types'

interface PublicAnalysisData extends AnalysisResult {
  shareId: string
  appId: string
  platform: string
  appName?: string
  dateFilter: string
  reviewsCount: number
  createdAt: string
  processingTime?: number
  openaiModel: string
}

export default function PublicAnalysisPage() {
  const params = useParams()
  const shareId = params.shareId as string
  
  const [analysis, setAnalysis] = useState<PublicAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${shareId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Анализ не найден или недоступен')
          } else {
            setError('Ошибка загрузки анализа')
          }
          return
        }

        const data = await response.json()
        setAnalysis(data)
      } catch (err) {
        console.error('Error fetching analysis:', err)
        setError('Ошибка загрузки анализа')
      } finally {
        setLoading(false)
      }
    }

    if (shareId) {
      fetchAnalysis()
    }
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Загрузка анализа...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Возможно, ссылка неверная или анализ был удален.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← На главную
          </Link>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateFilterLabel = (filter: string) => {
    switch (filter) {
      case '7days': return 'За последние 7 дней'
      case '30days': return 'За последние 30 дней'
      case '90days': return 'За последние 90 дней'
      case 'all': return 'За все время'
      default: return filter
    }
  }

  const getPlatformLabel = (platform: string) => {
    return platform === 'appstore' ? 'App Store' : 'Google Play'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Публичный анализ отзывов
          </h1>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Приложение:</span>
                  <p className="text-gray-900 dark:text-white">
                    {analysis.appName || `ID: ${analysis.appId}`}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Платформа:</span>
                  <p className="text-gray-900 dark:text-white">
                    {getPlatformLabel(analysis.platform)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Период:</span>
                  <p className="text-gray-900 dark:text-white">
                    {getDateFilterLabel(analysis.dateFilter)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Отзывов проанализировано:</span>
                  <p className="text-gray-900 dark:text-white">
                    {analysis.reviewsAnalyzed || analysis.reviewsCount}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Дата создания:</span>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(analysis.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500 dark:text-gray-400">Модель ИИ:</span>
                  <p className="text-gray-900 dark:text-white">
                    {analysis.openaiModel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="max-w-6xl mx-auto">
          <AnalysisPanel
            analysis={analysis}
            isLoading={false}
            onAnalyze={() => {}} // Disabled for public view
            onProblemClick={() => {}} // Disabled for public view
            selectedProblem={null}
            isPublicView={true}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Создать свой анализ
          </Link>
        </div>
      </div>
    </div>
  )
}
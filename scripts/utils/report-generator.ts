import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface TestResult {
  testName: string
  appId: string
  platform: string
  startTime: Date
  endTime: Date
  success: boolean
  reviewCount: number
  errors: string[]
  performance: {
    collectionTime: number
    averageRating: number
    countries: string[]
  }
}

interface ReportSummary {
  totalTests: number
  successfulTests: number
  failedTests: number
  totalReviews: number
  averageCollectionTime: number
  timestamp: Date
  results: TestResult[]
}

export class ReportGenerator {
  private reportsDir: string

  constructor() {
    this.reportsDir = join(process.cwd(), 'docs', 'testing', 'reports')
    this.ensureReportsDir()
  }

  private ensureReportsDir(): void {
    if (!existsSync(this.reportsDir)) {
      mkdirSync(this.reportsDir, { recursive: true })
    }
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  }

  generateReport(results: TestResult[], testType: string): string {
    const timestamp = new Date()
    const summary: ReportSummary = {
      totalTests: results.length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      totalReviews: results.reduce((sum, r) => sum + r.reviewCount, 0),
      averageCollectionTime: results.reduce((sum, r) => sum + r.performance.collectionTime, 0) / results.length,
      timestamp,
      results
    }

    const filename = `${testType}-${this.formatTimestamp(timestamp)}.json`
    const filepath = join(this.reportsDir, filename)

    writeFileSync(filepath, JSON.stringify(summary, null, 2))

    // Generate console summary
    this.printSummary(summary)

    return filepath
  }

  private printSummary(summary: ReportSummary): void {
    console.log('\n📊 Test Report Summary')
    console.log('=' .repeat(50))
    console.log(`🕐 Timestamp: ${summary.timestamp.toLocaleString()}`)
    console.log(`📋 Total Tests: ${summary.totalTests}`)
    console.log(`✅ Successful: ${summary.successfulTests}`)
    console.log(`❌ Failed: ${summary.failedTests}`)
    console.log(`📊 Success Rate: ${((summary.successfulTests / summary.totalTests) * 100).toFixed(1)}%`)
    console.log(`📝 Total Reviews: ${summary.totalReviews.toLocaleString()}`)
    console.log(`⏱️  Average Collection Time: ${summary.averageCollectionTime.toFixed(1)}s`)
    console.log('')

    if (summary.failedTests > 0) {
      console.log('❌ Failed Tests:')
      summary.results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.testName} (${result.appId}): ${result.errors.join(', ')}`)
      })
      console.log('')
    }

    console.log('📈 Performance by App:')
    summary.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`   ${status} ${result.testName}:`)
      console.log(`      Reviews: ${result.reviewCount.toLocaleString()}`)
      console.log(`      Time: ${result.performance.collectionTime.toFixed(1)}s`)
      console.log(`      Rating: ${result.performance.averageRating.toFixed(1)}★`)
      console.log(`      Countries: ${result.performance.countries.length}`)
    })
  }

  generateComparisonReport(beforeResults: TestResult[], afterResults: TestResult[]): string {
    const timestamp = new Date()
    const comparison = {
      timestamp,
      before: {
        totalReviews: beforeResults.reduce((sum, r) => sum + r.reviewCount, 0),
        averageTime: beforeResults.reduce((sum, r) => sum + r.performance.collectionTime, 0) / beforeResults.length,
        successRate: beforeResults.filter(r => r.success).length / beforeResults.length
      },
      after: {
        totalReviews: afterResults.reduce((sum, r) => sum + r.reviewCount, 0),
        averageTime: afterResults.reduce((sum, r) => sum + r.performance.collectionTime, 0) / afterResults.length,
        successRate: afterResults.filter(r => r.success).length / afterResults.length
      }
    }

    const improvement = {
      reviewsIncrease: comparison.after.totalReviews - comparison.before.totalReviews,
      reviewsIncreasePercent: ((comparison.after.totalReviews / comparison.before.totalReviews - 1) * 100),
      timeChange: comparison.after.averageTime - comparison.before.averageTime,
      successRateChange: comparison.after.successRate - comparison.before.successRate
    }

    const filename = `comparison-${this.formatTimestamp(timestamp)}.json`
    const filepath = join(this.reportsDir, filename)

    writeFileSync(filepath, JSON.stringify({ comparison, improvement, beforeResults, afterResults }, null, 2))

    // Print comparison
    console.log('\n📊 Before vs After Comparison')
    console.log('=' .repeat(50))
    console.log(`📝 Reviews: ${comparison.before.totalReviews.toLocaleString()} → ${comparison.after.totalReviews.toLocaleString()}`)
    console.log(`📈 Improvement: +${improvement.reviewsIncrease.toLocaleString()} (+${improvement.reviewsIncreasePercent.toFixed(1)}%)`)
    console.log(`⏱️  Time: ${comparison.before.averageTime.toFixed(1)}s → ${comparison.after.averageTime.toFixed(1)}s`)
    console.log(`✅ Success Rate: ${(comparison.before.successRate * 100).toFixed(1)}% → ${(comparison.after.successRate * 100).toFixed(1)}%`)

    return filepath
  }

  listRecentReports(limit: number = 10): string[] {
    const fs = require('fs')
    
    if (!existsSync(this.reportsDir)) {
      return []
    }

    const files = fs.readdirSync(this.reportsDir)
      .filter((file: string) => file.endsWith('.json'))
      .map((file: string) => ({
        name: file,
        path: join(this.reportsDir, file),
        mtime: fs.statSync(join(this.reportsDir, file)).mtime
      }))
      .sort((a: any, b: any) => b.mtime - a.mtime)
      .slice(0, limit)

    return files.map((f: any) => f.path)
  }
}

export default ReportGenerator
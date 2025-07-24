import { NextRequest, NextResponse } from 'next/server'
import { ReviewCollectionManager, CollectionStrategy } from '@/lib/services/reviewCollectionService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appId, platform, strategy } = body

    if (!appId || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: appId and platform' },
        { status: 400 }
      )
    }

    if (platform !== 'appstore' && platform !== 'googleplay') {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "appstore" or "googleplay"' },
        { status: 400 }
      )
    }

    // Проверяем, нет ли уже активной задачи для этого приложения
    const activeJobs = ReviewCollectionManager.getActiveJobs()
    const existingJob = activeJobs.find(
      job => job.appId === appId && 
             job.platform === platform && 
             (job.status === 'running' || job.status === 'pending')
    )

    if (existingJob) {
      return NextResponse.json({
        jobId: existingJob.id,
        message: 'Collection already in progress',
        status: existingJob.status,
        progress: existingJob.progress
      })
    }

    const collectionStrategy: CollectionStrategy = {
      type: strategy?.type || 'complete',
      countries: strategy?.countries,
      maxPagesPerCountry: strategy?.maxPagesPerCountry || 20,
      respectRateLimit: strategy?.respectRateLimit !== false,
      pauseOnErrors: strategy?.pauseOnErrors || false
    }

    console.log(`🚀 Starting ${collectionStrategy.type} collection for ${appId} (${platform})`)

    const jobId = await ReviewCollectionManager.createCollectionJob(
      appId,
      platform,
      collectionStrategy
    )

    return NextResponse.json({
      jobId,
      message: 'Collection job started',
      strategy: collectionStrategy
    })

  } catch (error) {
    console.error('Error starting collection job:', error)
    return NextResponse.json(
      { error: 'Failed to start collection job' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (jobId) {
      // Получить статус конкретной задачи
      const job = ReviewCollectionManager.getJobStatus(jobId)
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(job)
    } else {
      // Получить все активные задачи
      const activeJobs = ReviewCollectionManager.getActiveJobs()
      return NextResponse.json({ activeJobs })
    }

  } catch (error) {
    console.error('Error getting collection job status:', error)
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    const cancelled = ReviewCollectionManager.cancelJob(jobId)
    
    if (cancelled) {
      return NextResponse.json({ message: 'Job cancelled successfully' })
    } else {
      return NextResponse.json(
        { error: 'Job not found or cannot be cancelled' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Error cancelling collection job:', error)
    return NextResponse.json(
      { error: 'Failed to cancel job' },
      { status: 500 }
    )
  }
}
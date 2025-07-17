/**
 * @jest-environment node
 */

import { GET } from '@/app/api/reviews/route'
import { NextRequest } from 'next/server'

// Mock the ReviewService
jest.mock('@/lib/services/reviewService', () => ({
  ReviewService: {
    getReviews: jest.fn(),
  },
}))

import { ReviewService } from '@/lib/services/reviewService'

const mockReviewService = jest.mocked(ReviewService.getReviews)

describe('/api/reviews', () => {
  beforeEach(() => {
    mockReviewService.mockClear()
  })

  it('returns 400 when appId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews?platform=appstore')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing required parameters: appId and platform')
  })

  it('returns 400 when platform is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing required parameters: appId and platform')
  })

  it('returns 400 when platform is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456&platform=invalid')
    const response = await GET(request)
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid platform. Must be "appstore" or "googleplay"')
  })

  it('calls ReviewService.getReviews for appstore platform', async () => {
    const mockResult = {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
      fromCache: false,
    }
    mockReviewService.mockResolvedValue(mockResult)

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456&platform=appstore')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(mockReviewService).toHaveBeenCalledWith('123456', 'appstore', false)
    
    const data = await response.json()
    expect(data).toEqual(mockResult)
  })

  it('calls ReviewService.getReviews for googleplay platform', async () => {
    const mockResult = {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
      fromCache: false,
    }
    mockReviewService.mockResolvedValue(mockResult)

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=com.example.app&platform=googleplay')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(mockReviewService).toHaveBeenCalledWith('com.example.app', 'googleplay', false)
    
    const data = await response.json()
    expect(data).toEqual(mockResult)
  })

  it('returns 500 when ReviewService throws an error', async () => {
    mockReviewService.mockRejectedValue(new Error('Service failed'))

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456&platform=appstore')
    const response = await GET(request)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch reviews')
  })
})
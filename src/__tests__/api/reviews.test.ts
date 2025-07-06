/**
 * @jest-environment node
 */

import { GET } from '@/app/api/reviews/route'
import { NextRequest } from 'next/server'

// Mock the parser functions
jest.mock('@/lib/parsers/appstore', () => ({
  parseAppStoreReviews: jest.fn(),
}))

jest.mock('@/lib/parsers/googleplay', () => ({
  parseGooglePlayReviews: jest.fn(),
}))

import { parseAppStoreReviews } from '@/lib/parsers/appstore'
import { parseGooglePlayReviews } from '@/lib/parsers/googleplay'

const mockAppStoreReviews = jest.mocked(parseAppStoreReviews)
const mockGooglePlayReviews = jest.mocked(parseGooglePlayReviews)

describe('/api/reviews', () => {
  beforeEach(() => {
    mockAppStoreReviews.mockClear()
    mockGooglePlayReviews.mockClear()
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

  it('calls parseAppStoreReviews for appstore platform', async () => {
    const mockResult = {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
    }
    mockAppStoreReviews.mockResolvedValue(mockResult)

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456&platform=appstore')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(mockAppStoreReviews).toHaveBeenCalledWith('123456')
    
    const data = await response.json()
    expect(data).toEqual(mockResult)
  })

  it('calls parseGooglePlayReviews for googleplay platform', async () => {
    const mockResult = {
      reviews: [],
      totalCount: 0,
      averageRating: 0,
    }
    mockGooglePlayReviews.mockResolvedValue(mockResult)

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=com.example.app&platform=googleplay')
    const response = await GET(request)
    
    expect(response.status).toBe(200)
    expect(mockGooglePlayReviews).toHaveBeenCalledWith('com.example.app')
    
    const data = await response.json()
    expect(data).toEqual(mockResult)
  })

  it('returns 500 when parser throws an error', async () => {
    mockAppStoreReviews.mockRejectedValue(new Error('Parser failed'))

    const request = new NextRequest('http://localhost:3000/api/reviews?appId=123456&platform=appstore')
    const response = await GET(request)
    
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to fetch reviews')
  })
})
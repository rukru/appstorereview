import { render, screen } from '@testing-library/react'
import { ReviewCard } from '@/components/ReviewCard'
import { Review } from '@/types'

const mockReview: Review = {
  id: '1',
  title: 'Great app!',
  content: 'This app is amazing and works perfectly.',
  rating: 5,
  author: 'John Doe',
  date: '2024-01-01T00:00:00Z',
  platform: 'appstore',
  appId: '123456789',
  version: '1.0.0',
}

describe('ReviewCard', () => {
  it('renders review information correctly', () => {
    render(<ReviewCard review={mockReview} />)

    expect(screen.getByText('Great app!')).toBeInTheDocument()
    expect(screen.getByText('This app is amazing and works perfectly.')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('5/5')).toBeInTheDocument()
    expect(screen.getByText('App Store')).toBeInTheDocument()
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument()
  })

  it('renders correct number of stars for rating', () => {
    render(<ReviewCard review={mockReview} />)
    
    // Should have 5 filled stars for a 5-star rating
    const stars = screen.getAllByTestId('star-icon')
    expect(stars).toHaveLength(5)
  })

  it('displays Google Play badge for Google Play reviews', () => {
    const googlePlayReview: Review = {
      ...mockReview,
      platform: 'googleplay',
    }

    render(<ReviewCard review={googlePlayReview} />)
    expect(screen.getByText('Google Play')).toBeInTheDocument()
  })

  it('does not show version when not provided', () => {
    const reviewWithoutVersion: Review = {
      ...mockReview,
      version: undefined,
    }

    render(<ReviewCard review={reviewWithoutVersion} />)
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument()
  })
})
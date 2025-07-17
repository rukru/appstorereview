import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from '@/components/SearchForm'

const mockOnSearch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch for SavedApps component
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

describe('SearchForm', () => {
  beforeEach(() => {
    mockOnSearch.mockClear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    // Reset localStorage to return null by default
    localStorageMock.getItem.mockReturnValue(null)
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockClear()
  })

  it('renders form elements correctly', () => {
    render(<SearchForm onSearch={mockOnSearch} />)

    expect(screen.getByText('Search App Reviews')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /app store/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /google play/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /get reviews/i })).toBeInTheDocument()
  })

  it('switches between App Store and Google Play platforms', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={mockOnSearch} />)

    const googlePlayButton = screen.getByRole('button', { name: /google play/i })
    await user.click(googlePlayButton)

    expect(screen.getByPlaceholderText(/com.facebook.katana/)).toBeInTheDocument()
    expect(screen.getByText('Package Name')).toBeInTheDocument()
  })

  it('calls onSearch with correct parameters when form is submitted', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /get reviews/i })

    await user.type(input, '284882215')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('284882215', 'appstore', false)
    })
  })

  it('does not submit when input is empty', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={mockOnSearch} />)

    const submitButton = screen.getByRole('button', { name: /get reviews/i })
    await user.click(submitButton)

    expect(mockOnSearch).not.toHaveBeenCalled()
  })

  it('shows loading state when isLoading is true', () => {
    render(<SearchForm onSearch={mockOnSearch} isLoading={true} />)

    expect(screen.getByText('Fetching Reviews...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /fetching reviews/i })).toBeDisabled()
  })

  it('displays popular apps examples', () => {
    render(<SearchForm onSearch={mockOnSearch} />)

    expect(screen.getByText('Telegram: 686449807')).toBeInTheDocument()
    expect(screen.getByText('VK: 564177498')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp: com.whatsapp')).toBeInTheDocument()
    expect(screen.getByText('YouTube: com.google.android.youtube')).toBeInTheDocument()
  })

  it('loads saved app ID and platform from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'lastAppId') return '686449807'
      if (key === 'lastPlatform') return 'appstore'
      return null
    })

    render(<SearchForm onSearch={mockOnSearch} />)

    expect(screen.getByDisplayValue('686449807')).toBeInTheDocument()
  })

  it('saves app ID and platform to localStorage on submit', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={mockOnSearch} />)

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: /get reviews/i })

    await user.type(input, '686449807')
    await user.click(submitButton)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastAppId', '686449807')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastPlatform', 'appstore')
  })

  it('shows analyze button when hasReviews is true', () => {
    render(<SearchForm onSearch={mockOnSearch} hasReviews={true} onAnalyze={() => {}} />)

    expect(screen.getByRole('button', { name: /analyze with ai/i })).toBeInTheDocument()
  })

  it('does not show analyze button when hasReviews is false', () => {
    render(<SearchForm onSearch={mockOnSearch} hasReviews={false} onAnalyze={() => {}} />)

    expect(screen.queryByRole('button', { name: /analyze with ai/i })).not.toBeInTheDocument()
  })

  it('shows date filter when hasReviews is true and callback provided', () => {
    render(
      <SearchForm 
        onSearch={mockOnSearch} 
        hasReviews={true} 
        dateFilter="all"
        onDateFilterChange={() => {}}
      />
    )

    expect(screen.getByText('Analysis Period')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /all time/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /7 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument()
  })

  it('shows saved apps component', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    expect(screen.getByText('Saved Apps')).toBeInTheDocument()
  })
})
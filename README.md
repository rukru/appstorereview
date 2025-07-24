# App Store Review Analyzer

A comprehensive web application for collecting, analyzing, and gaining insights from App Store and Google Play reviews using AI-powered analysis.

## Features

- 🌍 **Multi-Region Collection**: Fetch reviews from 15+ countries for App Store apps
- 🤖 **GPT-4.1 Analysis**: Advanced AI analysis with structured output for features, requests, and problems
- 📊 **Rich Insights**: Identify appreciated features, feature requests, and user problems
- 🔍 **Smart Filtering**: Filter reviews by date, problems, and keywords
- 💾 **Caching System**: Efficient data storage with PostgreSQL and Prisma
- 🎨 **Modern UI**: Beautiful interface built with Next.js 15, React, and Tailwind CSS
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 
- **AI**: OpenAI GPT-4.1 with structured outputs
- **Parsing**: Custom parsers for App Store RSS + google-play-scraper for Google Play
- **UI Components**: Custom component library with shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm or yarn
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd appstorereview
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local.example .env.local
```

4. Add your environment variables to `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://username:password@localhost:5432/appstorereview
```

5. Set up the database:

```bash
npx prisma migrate dev
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Multi-Region App Store Collection

The application supports collecting reviews from multiple geographic regions:

- **Single**: Russia only (fast)
- **Major**: RU, US, GB, DE, FR, JP (default, balanced)
- **English**: US, GB, AU, CA (English-speaking)
- **Europe**: GB, DE, FR, IT, ES, RU (European markets)
- **Americas**: US, CA, BR, MX (North & South America)
- **Asia**: JP, KR, IN, CN (Asian markets)  
- **All**: All 15 major regions (comprehensive)

### Fetching App Store Reviews

1. Select "App Store" platform
2. Enter the App Store ID (found in the app's URL: `https://apps.apple.com/app/id[APP_ID]`)
3. Choose your region collection strategy
4. Click "Get Reviews"

Popular test apps:
- Telegram: `686449807`
- Facebook: `284882215`
- Instagram: `389801252`

### Fetching Google Play Reviews

1. Select "Google Play" platform
2. Enter the package name (found in the app's URL: `https://play.google.com/store/apps/details?id=[PACKAGE_NAME]`)
3. Click "Get Reviews"

Example package names:
- WhatsApp: `com.whatsapp`
- YouTube: `com.google.android.youtube`

### Enhanced AI Analysis

The application uses GPT-4.1 with structured outputs to provide:

- **Appreciated Features**: What users love about the app
- **Feature Requests**: What users want added  
- **Problems**: Issues users are experiencing
- **Overall satisfaction score** (1-10)
- **Sentiment analysis**: positive/negative/neutral/mixed
- **Multi-language support**: Russian and English analysis
- **Actionable recommendations** based on user feedback

## Available Scripts

- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open database admin interface

## Project Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   ├── reviews/    # Review collection endpoint
│   │   │   ├── analyze/    # AI analysis endpoint
│   │   │   ├── search/     # App search endpoint
│   │   │   └── analytics/  # Analytics endpoint
│   │   └── page.tsx        # Main application page
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── SearchForm.tsx  # Review search interface
│   │   ├── ReviewsList.tsx # Reviews display
│   │   └── AnalysisPanel.tsx # AI analysis display
│   ├── lib/
│   │   ├── parsers/       # Platform-specific parsers
│   │   │   ├── appstore.ts # Multi-region App Store parser
│   │   │   └── googleplay.ts # Google Play parser
│   │   ├── services/      # Business logic services
│   │   │   ├── reviewService.ts # Review management
│   │   │   └── analysisService.ts # AI analysis management
│   │   └── api/
│   │       └── openai.ts  # GPT-4.1 integration
│   ├── types/             # TypeScript type definitions
│   └── styles/            # Global styles
├── prisma/                # Database schema and migrations
├── scripts/               # Development and testing scripts
└── docs/                  # Documentation
```

## API Routes

### GET /api/reviews

Fetch reviews for a specific app with multi-region support.

**Parameters:**
- `appId`: App Store ID or Google Play package name
- `platform`: `appstore` or `googleplay`
- `regions`: Comma-separated list of regions (App Store only)

**Example:**
```
GET /api/reviews?appId=686449807&platform=appstore&regions=single
```

### POST /api/analyze

Analyze reviews using GPT-4.1 with structured outputs.

**Body:**
```json
{
  "reviews": [...],
  "language": "en" | "ru"
}
```

### GET /api/search

Search for apps on both platforms.

**Parameters:**
- `query`: Search term
- `platform`: `appstore` or `googleplay`

### GET /api/analytics

Get analytics data for reviews and usage.

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI analysis)
- `DATABASE_URL`: PostgreSQL connection string

### Database

The application uses PostgreSQL with Prisma ORM for efficient data storage and caching.

## Testing

- Manual testing through web interface
- API testing scripts in `/scripts` directory
- Test GPT-4.1 integration: `node scripts/test-enhanced-schema.js`
- Popular test app: Telegram (686449807)

## Limitations

- **Google Play**: Web scraping may be affected by Google's anti-bot measures
- **Rate Limits**: Both platforms may have rate limiting
- **OpenAI Costs**: AI analysis uses OpenAI API which incurs costs
- **Multi-region**: Collection from 15+ regions may take longer for comprehensive analysis

## Development Notes

- Always run linting before commits: `npm run lint`
- Test multi-region collection with popular apps
- Monitor OpenAI API usage and costs
- Implement proper error handling for rate limits
- Follow security best practices - never commit secrets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checking: `npm run lint && npm run typecheck`
5. Test your changes with database migrations if needed
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Disclaimer

This tool is for educational and research purposes. Please respect the terms of service of App Store and Google Play when using this application.

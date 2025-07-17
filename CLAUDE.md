# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**App Store Review Analyzer** - A comprehensive web application for collecting, analyzing, and gaining insights from App Store and Google Play reviews using AI-powered analysis.

### Key Features
- 🌍 **Multi-Region Collection**: Fetch reviews from 15+ countries for App Store apps
- 🤖 **GPT-4.1 Analysis**: Advanced AI analysis with structured output for features, requests, and problems
- 📊 **Rich Insights**: Identify appreciated features, feature requests, and user problems
- 🔍 **Smart Filtering**: Filter reviews by date, problems, and keywords
- 💾 **Caching System**: Efficient data storage with PostgreSQL and Prisma
- 🎨 **Modern UI**: Beautiful interface built with Next.js 15, React, and Tailwind CSS

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 
- **AI**: OpenAI GPT-4.1 with structured outputs
- **Parsing**: Custom parsers for App Store RSS + google-play-scraper for Google Play
- **UI Components**: Custom component library with shadcn/ui

## Repository Structure

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

## Development Workflow

### Essential Commands
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npx prisma migrate dev` - Run database migrations
- `npx prisma studio` - Open database admin interface

### Testing
- Manual testing through web interface
- API testing scripts in `/scripts` directory
- Test GPT-4.1 integration: `node scripts/test-enhanced-schema.js`

### Key Environment Variables
- `OPENAI_API_KEY` - Required for AI analysis
- `DATABASE_URL` - PostgreSQL connection string

## Multi-Region App Store Collection

The application supports collecting reviews from multiple geographic regions:

- **Single**: Russia only (fast)
- **Major**: RU, US, GB, DE, FR, JP (default, balanced)
- **English**: US, GB, AU, CA (English-speaking)
- **Europe**: GB, DE, FR, IT, ES, RU (European markets)
- **Americas**: US, CA, BR, MX (North & South America)
- **Asia**: JP, KR, IN, CN (Asian markets)  
- **All**: All 15 major regions (comprehensive)

See `MULTIREGION_FEATURES.md` for detailed information.

## AI Analysis Features

### Enhanced GPT-4.1 Integration
- **Structured Output**: JSON schema with strict validation
- **Appreciated Features**: What users love about the app
- **Feature Requests**: What users want added
- **Problems**: Issues users are experiencing
- **Multi-language**: Supports Russian and English analysis
- **Sentiment Analysis**: positive/negative/neutral/mixed

### Analysis Components
- Overall satisfaction score (1-10)
- Key themes and topics
- Actionable recommendations
- Problem severity and impact assessment
- Keyword extraction for filtering

## Code Standards

- **TypeScript**: Strict mode enabled, all new code must be typed
- **ESLint**: Configured for Next.js and React
- **Prisma**: Database-first approach with migrations
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Efficient caching and rate limiting
- **Security**: Input validation, no secrets in code

## Notes for Development

- Always run linting before commits
- Test multi-region collection with popular apps (Telegram: 686449807)
- Use the built-in popular apps list for testing
- Monitor OpenAI API usage and costs
- Implement proper error handling for rate limits
- Consider implementing analytics for usage tracking
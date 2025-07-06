# App Store Review Analyzer

A Next.js application that allows you to fetch and analyze app reviews from both App Store and Google Play using AI-powered insights.

## Features

- 🍎 **App Store Reviews**: Fetch reviews using official RSS feeds
- 🤖 **Google Play Reviews**: Parse reviews from Google Play Store pages
- 🧠 **AI Analysis**: Analyze reviews using OpenAI GPT-4 for sentiment analysis and insights
- 📊 **Review Statistics**: Display average ratings, review counts, and trends
- 🎨 **Modern UI**: Beautiful interface built with shadcn/ui components
- 🔍 **Smart Search**: Find apps easily with platform-specific search
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **AI Integration**: OpenAI GPT-4
- **Web Scraping**: Cheerio, Axios
- **Styling**: Tailwind CSS with dark mode support

## Getting Started

### Prerequisites

- Node.js 18.18.0 or higher
- npm or yarn
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

4. Add your OpenAI API key to `.env.local`:

```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Fetching App Store Reviews

1. Select "App Store" platform
2. Enter the App Store ID (found in the app's URL: `https://apps.apple.com/app/id[APP_ID]`)
3. Click "Get Reviews"

Example App Store IDs:

- Facebook: `284882215`
- Instagram: `389801252`

### Fetching Google Play Reviews

1. Select "Google Play" platform
2. Enter the package name (found in the app's URL: `https://play.google.com/store/apps/details?id=[PACKAGE_NAME]`)
3. Click "Get Reviews"

Example package names:

- WhatsApp: `com.whatsapp`
- YouTube: `com.google.android.youtube`

### AI Analysis

After fetching reviews, click "Analyze Reviews" to get AI-powered insights including:

- Overall sentiment analysis
- Key themes and topics
- Satisfaction score
- Actionable recommendations

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── analyze/       # AI analysis endpoint
│   │   └── reviews/       # Review fetching endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── AnalysisPanel.tsx # AI analysis display
│   ├── ReviewCard.tsx    # Individual review component
│   ├── ReviewsList.tsx   # Reviews list with stats
│   └── SearchForm.tsx    # App search form
├── lib/                  # Utility libraries
│   ├── api/             # API integration
│   │   └── openai.ts    # OpenAI service
│   ├── parsers/         # Review parsers
│   │   ├── appstore.ts  # App Store parser
│   │   └── googleplay.ts # Google Play parser
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
    └── index.ts
```

## API Routes

### GET /api/reviews

Fetch reviews for a specific app.

**Parameters:**

- `appId`: App Store ID or Google Play package name
- `platform`: `appstore` or `googleplay`

**Example:**

```
GET /api/reviews?appId=284882215&platform=appstore
```

### POST /api/analyze

Analyze reviews using AI.

**Body:**

```json
{
  "reviews": [...]
}
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required for AI analysis)

### Tailwind CSS

The project uses Tailwind CSS with custom configuration. CSS variables are defined in `globals.css` for consistent theming.

## Limitations

- **Google Play**: Web scraping may be affected by Google's anti-bot measures
- **Rate Limits**: Both platforms may have rate limiting
- **Review Count**: Limited number of reviews per request to manage API costs
- **OpenAI Costs**: AI analysis uses OpenAI API which incurs costs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checking
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Disclaimer

This tool is for educational and research purposes. Please respect the terms of service of App Store and Google Play when using this application.

# 🗄️ Database Setup

This guide helps you set up PostgreSQL database for App Store Review Analyzer.

## 🚀 Quick Start

### Local Development
1. Install PostgreSQL locally
2. Create database: `createdb appstore_reviews`
3. Set environment variable: `DATABASE_URL="postgresql://username:password@localhost:5432/appstore_reviews"`
4. Run migrations: `npx prisma migrate dev`

### Production (Vercel)
1. Create Vercel Postgres database
2. Copy connection string to environment variables
3. Deploy application - migrations run automatically

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@host:5432/database"
```

### Database Schema
The application uses Prisma ORM with the following main tables:
- `apps` - Application metadata
- `reviews` - User reviews
- `analyses` - AI analysis results

## 🛠️ Maintenance

### Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Database Studio
```bash
npx prisma studio
```

## 📊 Monitoring

Monitor database performance and usage through:
- Vercel dashboard (production)
- PostgreSQL logs
- Prisma query logs